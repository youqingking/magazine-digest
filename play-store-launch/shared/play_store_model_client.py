#!/usr/bin/env python3
"""Minimal model client for Play Store agent workflow runs."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any


class ModelUnavailableError(RuntimeError):
    """Raised when a required model configuration or call is unavailable."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


@dataclass(frozen=True)
class ModelConfig:
    provider: str
    model: str
    base_url: str = ""
    api_key_env: str = ""
    codex_command: str = "codex"
    auth_method: str = ""


def load_model_config() -> ModelConfig:
    provider = (
        os.environ.get("PLAY_STORE_AGENT_MODEL_PROVIDER")
        or os.environ.get("MODEL_PROVIDER")
        or os.environ.get("AGNO_PROVIDER")
        or os.environ.get("model_provider")
        or "openai"
    ).strip().lower()
    model = (
        os.environ.get("PLAY_STORE_AGENT_CODEX_MODEL")
        or os.environ.get("CODEX_MODEL")
        or os.environ.get("PLAY_STORE_AGENT_MODEL")
        or os.environ.get("MODEL_NAME")
        or os.environ.get("AGNO_MODEL")
        or os.environ.get("OPENAI_MODEL")
        or ""
    ).strip()

    if provider == "codex_cli":
        command = (os.environ.get("PLAY_STORE_AGENT_CODEX_COMMAND") or "codex").strip()
        resolved_command = shutil.which(command)
        if os.name == "nt" and resolved_command and not resolved_command.lower().endswith((".cmd", ".exe", ".bat")):
            resolved_command = shutil.which(f"{command}.cmd") or shutil.which(f"{command}.exe") or resolved_command
        if not resolved_command:
            raise ModelUnavailableError("model_required_but_unavailable: codex CLI is not installed or not on PATH")
        if not model:
            raise ModelUnavailableError("model_required_but_unavailable: set PLAY_STORE_AGENT_CODEX_MODEL or PLAY_STORE_AGENT_MODEL")
        return ModelConfig(
            provider=provider,
            model=model,
            codex_command=resolved_command,
            auth_method="chatgpt_login_or_cli_cached",
        )

    if provider != "openai":
        raise ModelUnavailableError(f"unsupported model provider: {provider}")
    if not model:
        raise ModelUnavailableError("model_required_but_unavailable: set PLAY_STORE_AGENT_MODEL or OPENAI_MODEL")
    if not os.environ.get("OPENAI_API_KEY"):
        raise ModelUnavailableError("model_required_but_unavailable: set OPENAI_API_KEY")

    return ModelConfig(
        provider=provider,
        model=model,
        base_url=(
            os.environ.get("PLAY_STORE_AGENT_MODEL_BASE_URL")
            or os.environ.get("MODEL_BASE_URL")
            or os.environ.get("OPENAI_BASE_URL")
            or "https://api.openai.com/v1"
        ).rstrip("/"),
        api_key_env="OPENAI_API_KEY",
        auth_method="api_key_env",
    )


def call_openai_chat(config: ModelConfig, messages: list[dict[str, str]]) -> dict[str, Any]:
    api_key = os.environ.get(config.api_key_env)
    if not api_key:
        raise ModelUnavailableError("model_required_but_unavailable: API key env is missing")

    payload = {
        "model": config.model,
        "messages": messages,
        "temperature": 0.2,
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{config.base_url}/chat/completions",
        data=data,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    before = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ModelUnavailableError(f"model_call_failed: HTTP {exc.code}: {detail[:500]}") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise ModelUnavailableError(f"model_call_failed: {exc}") from exc

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise ModelUnavailableError(f"model_call_failed: invalid JSON response: {exc}") from exc
    choices = parsed.get("choices")
    if not isinstance(choices, list) or not choices:
        raise ModelUnavailableError("model_call_failed: missing choices")
    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise ModelUnavailableError("model_call_failed: empty content")
    return {
        "response_id": str(parsed.get("id") or f"openai-chat-{int(time.time())}"),
        "content": content.strip(),
        "duration_ms": int((time.perf_counter() - before) * 1000),
    }


def sanitize_codex_output(text: str) -> str:
    lines: list[str] = []
    skip_next_numeric = False
    for raw_line in text.splitlines():
        line = raw_line.strip()
        lowered = line.lower()
        if "tokens used" in lowered:
            skip_next_numeric = True
            continue
        if skip_next_numeric and line.replace(",", "").isdigit():
            skip_next_numeric = False
            continue
        skip_next_numeric = False
        if line:
            lines.append(line)
    return "\n".join(lines)[-1200:]


def call_codex_cli(
    config: ModelConfig,
    *,
    prompt: str,
    schema_path: str,
    output_path: str,
    cwd: str,
) -> dict[str, Any]:
    command = [
        config.codex_command,
        "exec",
        "--ignore-user-config",
        "--model",
        config.model,
        "--sandbox",
        "read-only",
        "--ephemeral",
        "--output-schema",
        schema_path,
        "--output-last-message",
        output_path,
        "--cd",
        cwd,
        "-",
    ]
    before = time.perf_counter()
    try:
        result = subprocess.run(
            command,
            input=prompt.encode("utf-8"),
            capture_output=True,
            check=False,
            timeout=600,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {
            "exit_code": 127,
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "error_summary": str(exc)[:1200],
        }
    return {
        "exit_code": result.returncode,
        "duration_ms": int((time.perf_counter() - before) * 1000),
        "error_summary": sanitize_codex_output(
            result.stderr.decode("utf-8", errors="replace")
            + "\n"
            + result.stdout.decode("utf-8", errors="replace")
        ),
    }
