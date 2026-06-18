#!/usr/bin/env python3
"""Run existing app release gates and generate evidence-bound reports."""

from __future__ import annotations

import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import time
from collections.abc import Iterable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "release_build_agent_output.v2"
DEFAULT_OUTPUT_DIR = "play-store-launch/reports"
CORE_GATES = ("build", "typecheck", "preflight", "smoke")
FORBIDDEN_COMMAND_SNIPPETS = (
    "eas submit",
    "fastlane supply",
    "gradle publish",
    "play console",
    "track rollout",
)
PASS_STATUSES = {"pass", "passed", "ok", "success", "ready"}
FAIL_STATUSES = {"fail", "failed", "error", "invalid"}
BLOCKED_STATUSES = {"block", "blocked", "needs_human", "manual_required"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace") if path.is_file() else ""


def read_json(path: Path) -> dict[str, Any]:
    if not path.is_file():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def shell_name(name: str) -> str:
    if platform.system().lower().startswith("win") and name in {"npm", "pnpm", "yarn"}:
        return f"{name}.cmd"
    return name


def display_command(args: list[str]) -> str:
    return " ".join(args)


def run_command(root: Path, command: list[str], timeout: int) -> dict[str, Any]:
    started_at = utc_now()
    before = time.perf_counter()
    process: subprocess.Popen[str] | None = None
    try:
        process = subprocess.Popen(
            command,
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        stdout, stderr = process.communicate(timeout=timeout)
        return {
            "started_at": started_at,
            "finished_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": process.returncode,
            "stdout_excerpt": stdout[-4000:],
            "stderr_excerpt": stderr[-2000:],
            "parsed_json": parse_last_json_object(stdout),
        }
    except subprocess.TimeoutExpired:
        if process is not None:
            kill_process_tree(process.pid)
            try:
                stdout, stderr = process.communicate(timeout=5)
            except subprocess.TimeoutExpired:
                stdout, stderr = "", "process tree kill timed out"
        else:
            stdout, stderr = "", ""
        return {
            "started_at": started_at,
            "finished_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": 124,
            "stdout_excerpt": stdout[-4000:],
            "stderr_excerpt": stderr[-2000:],
            "parsed_json": parse_last_json_object(stdout),
        }
    except OSError as exc:
        return {
            "started_at": started_at,
            "finished_at": utc_now(),
            "duration_ms": int((time.perf_counter() - before) * 1000),
            "exit_code": 127,
            "stdout_excerpt": "",
            "stderr_excerpt": str(exc)[:2000],
            "parsed_json": None,
        }


def kill_process_tree(pid: int) -> None:
    if platform.system().lower().startswith("win"):
        subprocess.run(
            ["taskkill", "/pid", str(pid), "/t", "/f"],
            text=True,
            encoding="utf-8",
            errors="replace",
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return
    try:
        os.kill(pid, 9)
    except OSError:
        pass


def run_capture(root: Path, command: list[str], timeout: int = 30) -> dict[str, Any]:
    try:
        result = subprocess.run(
            command,
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            check=False,
            timeout=timeout,
        )
        return {
            "command": display_command(command),
            "exit_code": result.returncode,
            "stdout": result.stdout.strip(),
            "stderr": result.stderr.strip(),
        }
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {
            "command": display_command(command),
            "exit_code": 124 if isinstance(exc, subprocess.TimeoutExpired) else 127,
            "stdout": "",
            "stderr": str(exc),
        }


def first_existing_path(candidates: Iterable[str | None]) -> str:
    for candidate in candidates:
        if not candidate:
            continue
        if candidate in {"adb", "emulator"}:
            source = shutil.which(candidate)
            if source:
                return source
            continue
        if Path(candidate).is_file():
            return str(Path(candidate))
    return ""


def normalize_root_candidate(candidate: str | None) -> str:
    if not candidate:
        return ""
    if candidate.lower().endswith(".exe"):
        return str(Path(candidate).parent)
    return candidate


def resolve_hbuilderx_cli_path() -> str:
    roots = [
        os.environ.get("H0_5_HBUILDERX_ROOT"),
        normalize_root_candidate(os.environ.get("HBUILDERX_CLI_PATH")),
        normalize_root_candidate(os.environ.get("HBUILDERX_EXE")),
        normalize_root_candidate(os.environ.get("HBUILDERX_PATH")),
        "D:/HBuilderX0",
        "D:/HBuilderX",
        "C:/Program Files/HBuilderX",
        "C:/Program Files (x86)/HBuilderX",
        "D:/Program Files/HBuilderX",
    ]
    return first_existing_path([
        os.environ.get("HBUILDERX_CLI_PATH"),
        *[str(Path(root) / "cli.exe") for root in roots if root],
    ])


def resolve_adb_path() -> str:
    return first_existing_path([
        os.environ.get("ADB_PATH"),
        shutil.which("adb"),
        str(Path.home() / "AppData/Local/Android/Sdk/platform-tools/adb.exe"),
        "D:/Program Files/Netease/MuMu/nx_main/adb.exe",
        "adb",
    ])


def resolve_emulator_path() -> str:
    return first_existing_path([
        os.environ.get("ANDROID_EMULATOR_PATH"),
        shutil.which("emulator"),
        str(Path.home() / "AppData/Local/Android/Sdk/emulator/emulator.exe"),
        "emulator",
    ])


def planned_text(gates: list[dict[str, Any]]) -> str:
    pieces: list[str] = []
    for gate in gates:
        pieces.append(gate.get("gate_id", ""))
        pieces.append(gate.get("command", ""))
        for command in gate.get("commands", []):
            pieces.append(command.get("script", ""))
            pieces.append(command.get("script_value", ""))
    return " ".join(pieces).lower()


def needs_hbuilderx(gates: list[dict[str, Any]]) -> bool:
    text = planned_text(gates)
    return any(token in text for token in ("hbuilderx", "build:mobile", "build:shell", "app-android"))


def needs_android_device(gates: list[dict[str, Any]]) -> bool:
    text = planned_text(gates)
    return any(token in text for token in ("android", "adb", "h0_5-android"))


def hbuilderx_cli_ready(root: Path, cli_path: str) -> tuple[bool, dict[str, Any]]:
    result = run_capture(root, [cli_path, "version"], timeout=20)
    text = f"{result['stdout']}\n{result['stderr']}"
    ready = result["exit_code"] == 0 and "未检测到已打开的HBuilderX" not in text
    return ready, result


def bootstrap_hbuilderx(root: Path, timeout: int) -> dict[str, Any]:
    cli_path = resolve_hbuilderx_cli_path()
    action: dict[str, Any] = {
        "tool": "hbuilderx",
        "status": "skipped",
        "cli_path": cli_path or None,
        "actions": [],
        "reason": "",
    }
    if not cli_path:
        action["status"] = "blocked"
        action["reason"] = "HBUILDERX_CLI_MISSING"
        return action
    os.environ["HBUILDERX_CLI_PATH"] = cli_path

    ready, probe = hbuilderx_cli_ready(root, cli_path)
    action["actions"].append({"step": "probe_version", "result": probe})
    if ready:
        action["status"] = "ready"
        return action

    open_result = run_capture(root, [cli_path, "open"], timeout=30)
    action["actions"].append({"step": "cli_open", "result": open_result})
    deadline = time.time() + timeout
    while time.time() < deadline:
        ready, probe = hbuilderx_cli_ready(root, cli_path)
        if ready:
            action["status"] = "ready"
            action["actions"].append({"step": "probe_after_open", "result": probe})
            project_list = run_capture(root, [cli_path, "project", "list"], timeout=20)
            action["actions"].append({"step": "project_list", "result": project_list})
            return action
        time.sleep(3)

    action["status"] = "blocked"
    action["reason"] = "HBUILDERX_OPEN_TIMEOUT"
    action["actions"].append({"step": "final_probe", "result": probe})
    return action


def adb_connected_devices(root: Path, adb_path: str) -> tuple[list[str], dict[str, Any]]:
    result = run_capture(root, [adb_path, "devices"], timeout=20)
    devices: list[str] = []
    if result["exit_code"] == 0:
        devices = [
            line.split("\t")[0]
            for line in result["stdout"].splitlines()
            if line.strip().endswith("\tdevice")
        ]
    return devices, result


def list_avds(root: Path, emulator_path: str) -> tuple[list[str], dict[str, Any]]:
    result = run_capture(root, [emulator_path, "-list-avds"], timeout=20)
    avds = [line.strip() for line in result["stdout"].splitlines() if line.strip()]
    return avds, result


def wait_for_android_boot(root: Path, adb_path: str, timeout: int) -> tuple[str, list[dict[str, Any]]]:
    actions: list[dict[str, Any]] = []
    deadline = time.time() + timeout
    selected = ""
    while time.time() < deadline:
        devices, devices_result = adb_connected_devices(root, adb_path)
        actions.append({"step": "adb_devices", "result": devices_result, "devices": devices})
        if devices:
            selected = os.environ.get("H0_5_ANDROID_SERIAL") or devices[0]
            boot = run_capture(root, [adb_path, "-s", selected, "shell", "getprop", "sys.boot_completed"], timeout=20)
            actions.append({"step": "boot_completed", "serial": selected, "result": boot})
            if boot["stdout"].strip() == "1":
                return selected, actions
        time.sleep(5)
    return selected, actions


def bootstrap_android_emulator(root: Path, timeout: int, avd_name: str = "") -> dict[str, Any]:
    adb_path = resolve_adb_path()
    emulator_path = resolve_emulator_path()
    action: dict[str, Any] = {
        "tool": "android_emulator",
        "status": "skipped",
        "adb_path": adb_path or None,
        "emulator_path": emulator_path or None,
        "selected_avd": avd_name or None,
        "selected_serial": None,
        "actions": [],
        "reason": "",
    }
    if not adb_path:
        action["status"] = "blocked"
        action["reason"] = "ADB_MISSING"
        return action
    os.environ["ADB_PATH"] = adb_path

    devices, devices_result = adb_connected_devices(root, adb_path)
    action["actions"].append({"step": "initial_adb_devices", "result": devices_result, "devices": devices})
    if devices:
        serial = os.environ.get("H0_5_ANDROID_SERIAL") or devices[0]
        action["status"] = "ready"
        action["selected_serial"] = serial
        return action

    if not emulator_path:
        action["status"] = "blocked"
        action["reason"] = "ANDROID_EMULATOR_MISSING"
        return action

    avds, avd_result = list_avds(root, emulator_path)
    action["actions"].append({"step": "list_avds", "result": avd_result, "avds": avds})
    selected_avd = avd_name or os.environ.get("ANDROID_AVD_NAME") or os.environ.get("H0_5_ANDROID_AVD") or (avds[0] if avds else "")
    action["selected_avd"] = selected_avd or None
    if not selected_avd:
        action["status"] = "blocked"
        action["reason"] = "ANDROID_AVD_MISSING"
        return action

    emulator_args = [
        emulator_path,
        f"@{selected_avd}",
        "-no-window",
        "-no-audio",
        "-no-boot-anim",
        "-no-snapshot-save",
    ]
    try:
        subprocess.Popen(
            emulator_args,
            cwd=root,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
        )
        action["actions"].append({"step": "start_emulator", "command": display_command(emulator_args), "status": "started"})
    except OSError as exc:
        action["status"] = "blocked"
        action["reason"] = f"ANDROID_EMULATOR_START_FAILED: {exc}"
        return action

    serial, wait_actions = wait_for_android_boot(root, adb_path, timeout)
    action["actions"].extend(wait_actions[-8:])
    if serial:
        action["status"] = "ready"
        action["selected_serial"] = serial
    else:
        action["status"] = "blocked"
        action["reason"] = "ANDROID_EMULATOR_BOOT_TIMEOUT"
    return action


def bootstrap_local_tools(
    root: Path,
    gates: list[dict[str, Any]],
    timeout: int,
    avd_name: str = "",
) -> list[dict[str, Any]]:
    preparations: list[dict[str, Any]] = []
    if needs_hbuilderx(gates):
        preparations.append(bootstrap_hbuilderx(root, timeout))
    if needs_android_device(gates):
        preparations.append(bootstrap_android_emulator(root, timeout, avd_name))
    return preparations


def parse_last_json_object(text: str) -> Any | None:
    decoder = json.JSONDecoder()
    parsed: list[tuple[int, Any]] = []
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            value, consumed = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            parsed.append((consumed, value))
    if not parsed:
        return None
    _, largest = max(parsed, key=lambda item: item[0])
    return trim_json(largest)


def trim_json(value: Any, max_string: int = 800, max_items: int = 64) -> Any:
    if isinstance(value, dict):
        return {str(k): trim_json(v, max_string, max_items) for k, v in value.items()}
    if isinstance(value, list):
        items = [trim_json(item, max_string, max_items) for item in value[:max_items]]
        if len(value) > max_items:
            items.append({"truncated_items": len(value) - max_items})
        return items
    if isinstance(value, str) and len(value) > max_string:
        return value[:max_string] + f"...<truncated {len(value) - max_string} chars>"
    return value


def visible_files(root: Path) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            check=False,
        )
    except OSError:
        return [
            path.relative_to(root).as_posix()
            for path in root.rglob("*")
            if path.is_file() and "node_modules" not in path.parts
        ]
    if result.returncode != 0:
        return [
            path.relative_to(root).as_posix()
            for path in root.rglob("*")
            if path.is_file() and "node_modules" not in path.parts
        ]
    return [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]


def package_manager(root: Path) -> str:
    if (root / "pnpm-lock.yaml").is_file():
        return "pnpm"
    if (root / "yarn.lock").is_file():
        return "yarn"
    if (root / "package-lock.json").is_file() or (root / "package.json").is_file():
        return "npm"
    return "unknown"


def package_candidates(root: Path, files: list[str]) -> list[dict[str, Any]]:
    preferred = ["package.json", "apps/mobile/package.json", "mobile/package.json", "app/package.json"]
    discovered = [
        item
        for item in files
        if item.endswith("package.json")
        and not any(part in item.split("/") for part in {"node_modules", "unpackage", "output"})
    ]
    ordered: list[str] = []
    for item in [*preferred, *sorted(discovered)]:
        if item not in ordered:
            ordered.append(item)

    candidates: list[dict[str, Any]] = []
    for relative in ordered:
        data = read_json(root / relative)
        if not data:
            continue
        directory = Path(relative).parent.as_posix()
        candidates.append({
            "path": relative,
            "dir": "." if directory == "." else directory,
            "data": data,
            "scripts": data.get("scripts") or {},
        })
    return candidates


def readme_sources(root: Path) -> list[dict[str, str]]:
    sources: list[dict[str, str]] = []
    for relative in ("README.md", "apps/mobile/README.md", "mobile/README.md"):
        text = read_text(root / relative)
        if text:
            sources.append({"path": relative, "text": text})
    return sources


def extract_npm_run_scripts(text: str) -> list[str]:
    names: list[str] = []
    for match in re.finditer(r"\b(?:npm|pnpm|yarn)(?:\.cmd)?\s+run\s+([A-Za-z0-9:_-]+)\b", text):
        name = match.group(1)
        if name not in names:
            names.append(name)
    return names


def scripts_from_readme_lines(sources: list[dict[str, str]], keywords: Iterable[str]) -> list[str]:
    lowered_keywords = tuple(item.lower() for item in keywords)
    names: list[str] = []
    for source in sources:
        for line in source["text"].splitlines():
            lowered = line.lower()
            if not any(keyword in lowered for keyword in lowered_keywords):
                continue
            for name in extract_npm_run_scripts(line):
                if name not in names:
                    names.append(name)
    return names


def all_readme_scripts(sources: list[dict[str, str]]) -> list[str]:
    names: list[str] = []
    for source in sources:
        for name in extract_npm_run_scripts(source["text"]):
            if name not in names:
                names.append(name)
    return names


def find_script(candidates: list[dict[str, Any]], script_name: str) -> dict[str, Any] | None:
    for candidate in candidates:
        scripts = candidate["scripts"]
        if script_name in scripts:
            return {"candidate": candidate, "script": script_name, "value": str(scripts[script_name])}
    return None


def script_command(manager: str, directory: str, script: str) -> list[str]:
    if manager == "pnpm":
        command = [shell_name("pnpm")]
        if directory != ".":
            command += ["--dir", directory]
        return command + ["run", script]
    if manager == "yarn":
        command = [shell_name("yarn")]
        if directory != ".":
            command += ["--cwd", directory]
        return command + ["run", script]
    command = [shell_name("npm")]
    if directory != ".":
        command += ["--prefix", directory]
    return command + ["run", script]


def existing_script_plan(
    manager: str,
    candidates: list[dict[str, Any]],
    script_names: list[str],
    gate_id: str,
    required: bool,
) -> list[dict[str, Any]]:
    commands: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for script_name in script_names:
        found = find_script(candidates, script_name)
        if not found:
            continue
        candidate = found["candidate"]
        key = (candidate["path"], script_name)
        if key in seen:
            continue
        seen.add(key)
        argv = script_command(manager, candidate["dir"], script_name)
        commands.append({
            "gate_id": gate_id,
            "required": required,
            "script": script_name,
            "source": candidate["path"],
            "script_value": found["value"],
            "argv": argv,
            "command": display_command(argv),
        })
    return commands


def script_names_for_gate(candidates: list[dict[str, Any]], sources: list[dict[str, str]], gate_id: str) -> list[str]:
    readme_all = all_readme_scripts(sources)
    scripts = sorted({name for candidate in candidates for name in candidate["scripts"].keys()})

    def ordered(names: Iterable[str]) -> list[str]:
        wanted: list[str] = []
        for name in names:
            if name not in wanted:
                wanted.append(name)
        result: list[str] = []
        for name in readme_all:
            if name in wanted and name in scripts and name not in result:
                result.append(name)
        for name in wanted:
            if name in scripts and name not in result:
                result.append(name)
        return result

    if gate_id == "build":
        mobile_readme = scripts_from_readme_lines(
            sources,
            ("legacy mobile shell", "android", "mobile", "hbuilderx", "expo", "react native", "uni-app"),
        )
        candidates_for_build = [
            name
            for name in mobile_readme
            if name.startswith("build")
            or ":build" in name
            or name in {"android:build", "eas:build:android"}
        ]
        names = ordered([
            *candidates_for_build,
            "build:android",
            "android:build",
            "build:mobile",
            "build:shell",
            "build:app",
            "eas:build:android",
            "build",
        ])
        if "build:mobile" in names:
            names = [name for name in names if name != "build:shell"]
        return names

    if gate_id == "typecheck":
        return ordered(["typecheck", "check:types", "types:check", "tsc", "lint:types"])

    if gate_id == "preflight":
        return ordered(["preflight", "validate:preflight", "release:preflight"])

    if gate_id == "smoke":
        mobile_readme = scripts_from_readme_lines(
            sources,
            ("legacy mobile shell", "android", "mobile", "hbuilderx", "h5", "expo", "react native", "uni-app"),
        )
        preferred = [
            name
            for name in mobile_readme
            if name == "smoke" or name.startswith("smoke:")
        ]
        if preferred:
            specific = [name for name in preferred if name != "smoke"]
            android_specific = [
                name
                for name in specific
                if any(keyword in name.lower() for keyword in ("android", "hbuilderx", "app"))
            ]
            if android_specific:
                return ordered(android_specific)
            if specific:
                return ordered(specific)
            return ordered(["smoke"])
        mobile_keywords = ("android", "mobile", "h5", "hbuilderx", "release", "app")
        smoke_names = [
            name
            for name in scripts
            if name == "smoke"
            or (name.startswith("smoke:") and any(keyword in name.lower() for keyword in mobile_keywords))
        ]
        return ordered([*smoke_names, "smoke", "smoke:fixture", "fixture:smoke", "smoke:test-inputs"])

    return []


def discover_gate_plans(root: Path, candidates: list[dict[str, Any]], sources: list[dict[str, str]]) -> list[dict[str, Any]]:
    manager = package_manager(root)
    plans: list[dict[str, Any]] = []
    for gate_id in CORE_GATES:
        names = script_names_for_gate(candidates, sources, gate_id)
        commands = existing_script_plan(manager, candidates, names, gate_id, True)
        if not commands:
            plans.append({
                "gate_id": gate_id,
                "required": True,
                "status": "script_missing",
                "reason": f"未在现有 package scripts / README 命令中发现 {gate_id} 门禁命令。",
                "command": "",
                "commands": [],
                "source": None,
            })
            continue
        plans.append({
            "gate_id": gate_id,
            "required": True,
            "status": "planned",
            "reason": "已发现现有命令，等待执行。",
            "command": " && ".join(item["command"] for item in commands),
            "commands": commands,
            "source": ", ".join(sorted({item["source"] for item in commands})),
        })
    return plans


def contains_forbidden_action(command: dict[str, Any]) -> bool:
    text = f"{command['command']} {command.get('script_value', '')}".lower()
    return any(snippet in text for snippet in FORBIDDEN_COMMAND_SNIPPETS)


def scalar_values(value: Any, target_key: str) -> list[Any]:
    found: list[Any] = []
    if isinstance(value, dict):
        for key, child in value.items():
            if key == target_key:
                found.append(child)
            found.extend(scalar_values(child, target_key))
    elif isinstance(value, list):
        for child in value:
            found.extend(scalar_values(child, target_key))
    return found


def classify_command(gate_id: str, result: dict[str, Any]) -> tuple[str, str]:
    parsed = result.get("parsed_json")
    exit_code = result.get("exit_code")
    if exit_code == 124:
        return "fail", "命令超时，未能形成通过证据。"
    if exit_code not in (0, None):
        return "fail", f"命令退出码为 {exit_code}。"
    if not isinstance(parsed, dict):
        return "pass", "命令退出码为 0；未发现可解析 JSON，只能使用退出码作为证据。"

    statuses = [str(value).lower() for value in scalar_values(parsed, "status") if value is not None]
    for status in statuses:
        if status in BLOCKED_STATUSES:
            return "blocked", f"结构化输出 status={status}。"
    for status in statuses:
        if status in FAIL_STATUSES:
            return "fail", f"结构化输出 status={status}。"

    passed_values = scalar_values(parsed, "passed")
    if any(value is False for value in passed_values):
        return "fail", "结构化输出包含 passed=false。"

    classification_values = [
        str(value).lower()
        for value in scalar_values(parsed, "classification")
        if value is not None
    ]
    for classification in classification_values:
        if "blocked" in classification:
            return "blocked", f"结构化输出 classification={classification}。"
        if "fail" in classification:
            return "fail", f"结构化输出 classification={classification}。"

    if gate_id == "build":
        for key in ("compile_success", "compile_readiness_passed"):
            if any(value is False for value in scalar_values(parsed, key)):
                return "fail", f"结构化输出 {key}=false。"
        if any(value is False for value in scalar_values(parsed, "real_compile_attempted")):
            return "fail", "结构化输出 real_compile_attempted=false，不能证明真实构建。"

    if gate_id == "smoke":
        if any(value is False for value in scalar_values(parsed, "preflight_ok")):
            return "fail", "结构化输出 preflight_ok=false。"
        if any(value is False for value in scalar_values(parsed, "verify_ok")):
            return "fail", "结构化输出 verify_ok=false。"
        if any(value is None for value in scalar_values(parsed, "mobile_status")):
            return "fail", "结构化输出 mobile_status=null，不能证明移动端 smoke。"

    if gate_id == "preflight":
        result_values = scalar_values(parsed, "result")
        for value in result_values:
            if isinstance(value, dict) and value.get("passed") is False:
                return "fail", "结构化输出 result.passed=false。"
        if any(isinstance(value, int) and value > 0 for value in scalar_values(parsed, "missing_count")):
            return "fail", "结构化输出 missing_count>0。"

    if passed_values and all(value is True for value in passed_values):
        return "pass", "结构化输出 passed=true。"
    if statuses and all(status in PASS_STATUSES for status in statuses):
        return "pass", f"结构化输出 status={','.join(statuses)}。"
    return "pass", "退出码和结构化输出未发现失败信号。"


def execute_gates(
    root: Path,
    gates: list[dict[str, Any]],
    timeout: int,
    execute: bool,
    deadline: float | None = None,
) -> list[dict[str, Any]]:
    for gate in gates:
        if gate["status"] == "script_missing":
            continue
        command_results: list[dict[str, Any]] = []
        for command in gate["commands"]:
            record = {
                "script": command["script"],
                "source": command["source"],
                "command": command["command"],
                "script_value": command["script_value"],
                "required": command["required"],
                "status": "not_run",
                "reason": "命令未执行。",
                "result": None,
            }
            if contains_forbidden_action(command):
                record["status"] = "blocked"
                record["reason"] = "命令疑似包含提交、发布或外部状态变更动作，已阻止执行。"
                command_results.append(record)
                continue
            if not execute:
                command_results.append(record)
                continue
            if deadline is not None:
                remaining = int(deadline - time.time())
                if remaining <= 3:
                    record["status"] = "not_run"
                    record["reason"] = "全局执行预算已耗尽，未执行该命令。"
                    command_results.append(record)
                    continue
                command_timeout = min(timeout, remaining)
            else:
                command_timeout = timeout
            result = run_command(root, command["argv"], command_timeout)
            status, reason = classify_command(gate["gate_id"], result)
            record["status"] = status
            record["reason"] = reason
            record["result"] = result
            enrich_command_record(root, gate["gate_id"], record)
            command_results.append(record)

        gate["commands"] = command_results
        gate["status"], gate["reason"] = aggregate_gate_status(command_results)
    return gates


def aggregate_gate_status(commands: list[dict[str, Any]]) -> tuple[str, str]:
    if not commands:
        return "script_missing", "未发现可执行命令。"
    statuses = [command["status"] for command in commands]
    if any(status == "blocked" for status in statuses):
        failed = [command for command in commands if command["status"] == "blocked"]
        return "blocked", failed[0]["reason"]
    if any(status == "fail" for status in statuses):
        failed = [command for command in commands if command["status"] == "fail"]
        return "fail", failed[0]["reason"]
    if any(status == "not_run" for status in statuses):
        return "not_run", "至少一个命令未执行，不能形成通过证据。"
    if all(status == "pass" for status in statuses):
        return "pass", "所有已发现的现有命令均形成通过证据。"
    return "fail", "命令状态不完整，不能形成通过证据。"


def latest_file(directory: Path, pattern: str) -> Path | None:
    if not directory.is_dir():
        return None
    files = [path for path in directory.glob(pattern) if path.is_file()]
    if not files:
        return None
    return max(files, key=lambda path: path.stat().st_mtime)


def tail_lines(path: Path, limit: int = 80) -> list[str]:
    text = read_text(path)
    if not text:
        return []
    return [line for line in text.splitlines() if line.strip()][-limit:]


def diagnostic_lines(lines: list[str]) -> list[str]:
    patterns = (
        "pages.json condition",
        "需在 pages 数组中",
        "AUTH_TEST_PAGE",
        "AUTOMATION_SUMMARY",
        "uniCloud本地调试服务启动失败",
        "编译失败",
        "已停止运行",
        "error",
        "failed",
    )
    selected: list[str] = []
    for line in lines:
        lowered = line.lower()
        if any(pattern.lower() in lowered for pattern in patterns):
            selected.append(line)
    return selected[-12:]


def related_android_ui_artifacts(root: Path) -> dict[str, Any]:
    out_dir = root / "output" / "stage-h0_5-android-ui"
    stdout_log = latest_file(out_dir, "hbuilderx-run.*.stdout.log")
    stderr_log = latest_file(out_dir, "hbuilderx-run.*.stderr.log")
    report = read_json(out_dir / "android-device-ui-smoke.json")
    stdout_tail = tail_lines(stdout_log) if stdout_log else []
    stderr_tail = tail_lines(stderr_log) if stderr_log else []
    return {
        "latest_stdout_log": stdout_log.name if stdout_log else "",
        "latest_stderr_log": stderr_log.name if stderr_log else "",
        "stdout_tail": stdout_tail[-20:],
        "stderr_tail": stderr_tail[-20:],
        "diagnostic_lines": diagnostic_lines([*stdout_tail, *stderr_tail]),
        "last_report": report,
    }


def enrich_command_record(root: Path, gate_id: str, record: dict[str, Any]) -> None:
    if gate_id == "smoke" and record.get("script") == "smoke:h0_5-android-ui":
        artifacts = related_android_ui_artifacts(root)
        if artifacts.get("diagnostic_lines") or artifacts.get("last_report"):
            result = record.setdefault("result", {})
            result["related_artifacts"] = artifacts
            if not result.get("parsed_json") and isinstance(artifacts.get("last_report"), dict):
                report = artifacts["last_report"]
                if report:
                    result["parsed_json"] = report


def blockers(gates: list[dict[str, Any]]) -> list[dict[str, str]]:
    items: list[dict[str, str]] = []
    for gate in gates:
        if gate["required"] and gate["status"] != "pass":
            if gate["status"] == "script_missing":
                unblock_action = f"在项目已有脚本体系中补齐 {gate['gate_id']} 命令，并真实执行该命令。"
            elif gate["status"] == "not_run":
                unblock_action = f"真实执行已发现的 {gate['gate_id']} 命令，并保留退出码和结构化输出。"
            else:
                unblock_action = f"修复 {gate['gate_id']} 命令报告的失败原因后，重新真实执行该 gate。"
            items.append({
                "id": f"gate:{gate['gate_id']}",
                "status": gate["status"],
                "reason": gate["reason"],
                "unblock_action": unblock_action,
            })
    return items


def overall_status(blocker_items: list[dict[str, str]]) -> str:
    return "blocked" if blocker_items else "pass"


def command_summary(command: dict[str, Any]) -> str:
    result = command.get("result") or {}
    exit_code = result.get("exit_code")
    exit_text = "未执行" if exit_code is None else str(exit_code)
    return f"`{command['script']}` / `{command['status']}` / exit={exit_text} / {command['reason']}"


def command_provenance(command: dict[str, Any]) -> str:
    return (
        f"  - 来源：`{command['source']}`；脚本内容：`{command['script_value']}`；"
        f"实际命令：`{command['command']}`"
    )


def interesting_evidence(gate_id: str, parsed: dict[str, Any]) -> dict[str, Any]:
    evidence: dict[str, Any] = {}
    for key in ("status", "blocking_reason", "classification", "passed", "result"):
        if key in parsed:
            evidence[key] = parsed[key]
    if gate_id == "build":
        for key in ("compile_success", "compile_readiness_passed", "real_compile_attempted"):
            if key in parsed:
                evidence[key] = parsed[key]
        findings = parsed.get("findings")
        if isinstance(findings, dict):
            focused = {
                key: findings.get(key)
                for key in ("missing_files", "cross_root_imports", "relevant_node_only_references")
                if findings.get(key)
            }
            if focused:
                evidence["findings"] = trim_json(focused, max_items=8)
    if gate_id == "smoke":
        for key in (
            "layer",
            "mobile_status",
            "connected_devices",
            "detected_packages",
            "package_name",
            "build_dir",
            "compile_succeeded",
            "automation_summary",
            "ui_summary",
            "diagnostic_summary",
            "final_screenshot",
            "hbuilderx_stdout_tail",
        ):
            if key in parsed:
                evidence[key] = trim_json(parsed[key], max_items=12)
    if gate_id == "preflight":
        missing_paths = []
        required_paths = parsed.get("required_paths")
        if isinstance(required_paths, list):
            for item in required_paths:
                if isinstance(item, dict) and item.get("exists") is False and item.get("path"):
                    missing_paths.append(item["path"])
        if missing_paths:
            evidence["missing_paths"] = missing_paths
    return evidence


def gate_proof(gate: dict[str, Any]) -> str:
    if gate["status"] == "pass":
        return "已由真实执行的项目命令证明通过。"
    if gate["status"] == "script_missing":
        return "未发现项目已有命令，不能证明。"
    if gate["status"] == "not_run":
        return "命令未执行，不能证明。"
    return gate["reason"]


def action_for_parsed_reason(gate_id: str, parsed: dict[str, Any]) -> list[str]:
    actions: list[str] = []
    reason = str(parsed.get("blocking_reason") or "")
    classification = str(parsed.get("classification") or "")
    if gate_id == "build" and classification == "compile_readiness_failed":
        findings = parsed.get("findings") if isinstance(parsed.get("findings"), dict) else {}
        cross_root = findings.get("cross_root_imports") if isinstance(findings, dict) else []
        node_refs = findings.get("relevant_node_only_references") if isinstance(findings, dict) else []
        if cross_root:
            actions.append(f"修复移动端跨根引用：{', '.join(map(str, cross_root[:4]))}。")
        if node_refs:
            files = [str(item.get("file")) for item in node_refs[:4] if isinstance(item, dict) and item.get("file")]
            if files:
                actions.append(f"移除或替换移动端运行路径里的 Node-only API 引用：{', '.join(files)}。")
        actions.append("修复后重新运行 `npm.cmd run build:mobile`，直到 `compile_success=true` 或真实编译通过。")
    if gate_id == "typecheck":
        actions.append("项目当前没有现成 typecheck 脚本；需要在项目脚本体系中补齐真实类型检查命令后再执行。")
    if gate_id == "smoke":
        if reason == "HBUILDERX_WEB_BUILD_MISSING":
            build_dir = parsed.get("build_dir")
            if build_dir:
                actions.append(f"H5/Web smoke 需要构建产物，但目录不存在或为空：`{build_dir}`。")
            actions.append("先用 HBuilderX 对 `mobile/` 生成 H5/Web build，或补充一个项目已有脚本来生成该目录；完成后重跑 `npm.cmd run smoke:stage-ui35-h5` 和 `npm.cmd run smoke:h0_5-h5`。")
        elif reason == "HBUILDERX_PROJECT_MOBILE_MISSING":
            actions.append("确认移动端真实项目目录是 `mobile/` 还是其他路径；如果脚本目标路径不对，需要修正项目路径配置。")
        elif reason == "HBUILDERX_ANDROID_COMPILE_FAILED":
            actions.append("HBuilderX 已可调用但 Android 编译失败；需要查看 HBuilderX compile log，修复编译错误后重跑。")
        elif reason == "ADB_DEVICE_MISSING":
            actions.append("需要一个 ADB 可见设备；skill 会尝试启动本机模拟器，若仍失败则需要提供可启动 AVD 名称或修复 Android SDK/ADB。")
        elif reason == "ANDROID_PACKAGE_UNRESOLVED":
            packages = parsed.get("detected_packages") if isinstance(parsed.get("detected_packages"), list) else []
            if packages:
                actions.append(f"ADB 已有设备，但检测到多个第三方包：{', '.join(map(str, packages))}，脚本不能安全猜测哪个是目标 app。")
            actions.append("需要安装/确认目标 app 包名，并在重跑时提供 `H0_5_ANDROID_PACKAGE=<包名>`；如果 monkey 无法启动，还需要提供 `H0_5_ANDROID_ACTIVITY=<Activity>`。")
        elif reason == "HBUILDERX_APP_LAUNCH_TIMEOUT":
            stdout_tail = parsed.get("hbuilderx_stdout_tail") if isinstance(parsed.get("hbuilderx_stdout_tail"), list) else []
            page_error = [line for line in stdout_tail if "pages/auth-test/index" in str(line) and "pages 数组" in str(line)]
            if page_error:
                actions.append("HBuilderX 日志显示目标自动化页面未注册：`pages/auth-test/index 需在 pages 数组中`。")
                actions.append("`mobile/pages/auth-test/index.vue` 存在，但 `mobile/pages.json` 没有注册该 page；需要把 `pages/auth-test/index` 加入 `pages` 数组，或修改 smoke 脚本使用已注册页面。")
            actions.append("修复页面注册/启动目标后，重跑 `npm.cmd run smoke:h0_5-android-ui`；如果仍超时，再延长该命令 timeout 并检查 HBuilderX stdout/stderr tail。")
        elif parsed.get("mobile_status", "not-present") is None:
            actions.append("通用 smoke 没有覆盖移动端；必须依赖移动端专用 smoke 命令证明 app smoke。")
    if gate_id == "preflight":
        result = parsed.get("result") if isinstance(parsed.get("result"), dict) else {}
        missing_paths = []
        required_paths = parsed.get("required_paths")
        if isinstance(required_paths, list):
            for item in required_paths:
                if isinstance(item, dict) and item.get("exists") is False and item.get("path"):
                    missing_paths.append(item["path"])
        if result.get("passed") is False and missing_paths:
            actions.append(f"preflight contract 缺失路径：{', '.join(map(str, missing_paths))}。")
            actions.append("需要判断这些路径是应该补齐，还是 contract 应该改为当前真实项目结构；不要为了过检随意创建空文件。")
        elif result.get("passed") is False:
            actions.append("preflight 结构化结果为 passed=false；需要按脚本输出逐项修复失败项后重跑。")
    return actions


def action_for_command(gate_id: str, command: dict[str, Any]) -> list[str]:
    if command["status"] == "pass":
        return []
    parsed = ((command.get("result") or {}).get("parsed_json") or {})
    if isinstance(parsed, dict):
        actions = action_for_parsed_reason(gate_id, parsed)
        if actions:
            return actions
    if command["status"] == "not_run":
        return [f"真实执行 `{command['command']}` 并保留退出码和结构化输出。"]
    if command["status"] == "blocked":
        return ["该命令被阻塞；需要先解除本地工具、设备或脚本报告的 blocking_reason。"]
    if command["status"] == "fail":
        return ["该命令已执行但未形成通过证据；需要根据 stdout/stderr 或 parsed 输出修复后重跑。"]
    return []


def preparation_rows(preparations: list[dict[str, Any]]) -> str:
    if not preparations:
        return "- 未触发本地工具准备。"
    rows: list[str] = []
    for item in preparations:
        details = []
        if item.get("cli_path"):
            details.append(f"cli=`{item['cli_path']}`")
        if item.get("adb_path"):
            details.append(f"adb=`{item['adb_path']}`")
        if item.get("emulator_path"):
            details.append(f"emulator=`{item['emulator_path']}`")
        if item.get("selected_avd"):
            details.append(f"avd=`{item['selected_avd']}`")
        if item.get("selected_serial"):
            details.append(f"serial=`{item['selected_serial']}`")
        reason = f"；reason=`{item['reason']}`" if item.get("reason") else ""
        suffix = f"；{'；'.join(details)}" if details else ""
        rows.append(f"- `{item['tool']}`：`{item['status']}`{suffix}{reason}")
    return "\n".join(rows)


def final_summary(data: dict[str, Any]) -> str:
    passed = [gate["gate_id"] for gate in data["command_gates"] if gate["status"] == "pass"]
    blocked = [gate["gate_id"] for gate in data["command_gates"] if gate["status"] != "pass"]
    ready_tools = [item["tool"] for item in data.get("environment_preparation", []) if item.get("status") == "ready"]
    if not blocked:
        return (
            "四个核心 gate 均已由真实命令证明通过：build 已完成真实移动端编译，typecheck 已完成项目脚本检查，"
            "preflight 已完成发布前检查，smoke 已证明 Android app 能在设备/模拟器启动并进入目标 UI 页面。"
        )
    parts = [
        f"当前不能证明 app 通过发布前工程门禁；未通过 gate：{', '.join(blocked)}。",
    ]
    if ready_tools:
        parts.append(f"本地工具已自动准备成功：{', '.join(ready_tools)}；剩余阻塞来自项目命令输出本身。")
    if passed:
        parts.append(f"已通过 gate：{', '.join(passed)}。")
    priority_phrases = {
        "build": "修复 `build` 报告的构建/编译阻塞",
        "preflight": "修复 `preflight` 报告的发布前检查阻塞",
        "typecheck": "补齐真实 `typecheck` 命令并执行通过",
        "smoke": "修复移动端 `smoke` 的 HBuilderX/H5/Android 设备阻塞并重跑",
    }
    priorities = [priority_phrases[gate_id] for gate_id in CORE_GATES if gate_id in blocked]
    if priorities:
        parts.append(f"优先顺序：{'；'.join(priorities)}。")
    return "\n".join(f"- {part}" for part in parts)


def repair_plan(data: dict[str, Any]) -> str:
    sections: list[str] = []
    for gate in data["command_gates"]:
        lines: list[str] = []
        if not gate["commands"]:
            lines.extend([
                f"- 失败类型：`{gate['status']}`。",
                f"- 直接原因：{gate['reason']}",
            ])
            if gate["gate_id"] == "typecheck":
                lines.append("- 需要人类决定：项目应该使用 TypeScript 类型检查、Vue/uni-app 类型检查，还是现有 JS 项目暂不支持类型检查。")
                lines.append("- 需要修改：在现有 `package.json` scripts 中补齐真实 `typecheck` 命令，不能用 `verify` 或 `preflight` 冒充。")
                lines.append("- 重跑命令：补齐后运行新的 `npm.cmd run typecheck` 或等价现有脚本。")
        for command in gate["commands"]:
            if command["status"] == "pass":
                continue
            lines.append(f"- 命令：`{command['command']}`")
            lines.append(f"  - 失败类型：`{command['status']}`。")
            lines.append(f"  - 直接原因：{command['reason']}")
            actions = action_for_command(gate["gate_id"], command)
            if actions:
                lines.append("  - 怎么修改：")
                for action in actions:
                    lines.append(f"    - {action}")
        if lines:
            sections.append(f"### `{gate['gate_id']}`\n" + "\n".join(lines))
    return "\n\n".join(sections) or "- 无"


def smoke_diagnostic_note(parsed: dict[str, Any]) -> str:
    if parsed.get("layer") != "android_device_ui_smoke":
        return ""
    ui_summary = parsed.get("ui_summary") if isinstance(parsed.get("ui_summary"), dict) else {}
    diagnostic = parsed.get("diagnostic_summary") if isinstance(parsed.get("diagnostic_summary"), dict) else {}
    if ui_summary.get("ui_smoke_passed") is not True:
        return ""
    note = str(diagnostic.get("note") or "")
    if not note:
        return ""
    return (
        "核心 UI smoke 已通过：Android app 已由 HBuilderX 编译/启动，并进入目标 smoke 页面；"
        f"深诊断说明为 `{note}`，auth/device DB 诊断用于后续账号与设备联调，"
        "不作为本次 build/typecheck/smoke/preflight 工程门禁的失败条件。"
    )


def render_markdown(data: dict[str, Any]) -> str:
    gate_rows = "\n".join(
        f"| `{g['gate_id']}` | `{g['status']}` | {gate_proof(g)} |"
        for g in data["command_gates"]
    )
    command_blocks = []
    for gate in data["command_gates"]:
        lines = [f"### `{gate['gate_id']}`"]
        if not gate["commands"]:
            lines.append(f"- `{gate['status']}`：{gate['reason']}")
        for command in gate["commands"]:
            lines.append(f"- {command_summary(command)}")
            lines.append(command_provenance(command))
            parsed = ((command.get("result") or {}).get("parsed_json") or {})
            if isinstance(parsed, dict):
                interesting = interesting_evidence(gate["gate_id"], parsed)
                if interesting:
                    lines.append(f"  - parsed: `{json.dumps(interesting, ensure_ascii=False)}`")
                diagnostic_note = smoke_diagnostic_note(parsed) if gate["gate_id"] == "smoke" else ""
                if diagnostic_note:
                    lines.append(f"  - 诊断说明：{diagnostic_note}")
            actions = action_for_command(gate["gate_id"], command)
            if actions:
                lines.append("  - 需要处理：")
                for action in actions:
                    lines.append(f"    - {action}")
        command_blocks.append("\n".join(lines))

    blocker_rows = "\n".join(
        f"- `{b['id']}`：status=`{b['status']}`；原因：{b['reason']}；解除：{b['unblock_action']}"
        for b in data["gate_blockers"]
    )
    return f"""# release-build-agent 工程门禁证明报告

生成时间：`{data['generated_at']}`

## 总状态
- overall_status: `{data['overall_status']}`
- 证明模式：`{data['proof_mode']}`

## 本地工具准备
{preparation_rows(data.get("environment_preparation", []))}

## 工程门禁矩阵
| Gate | Status | 证明结论 |
| --- | --- | --- |
{gate_rows}

## 命令执行证据
{chr(10).join(command_blocks)}

## 诊断与修复计划
{repair_plan(data)}

## 阻塞项
{blocker_rows or "- 无"}

## 总结
{final_summary(data)}
"""


def generate(
    root: Path,
    output_dir: Path,
    timeout: int,
    execute: bool,
    tool_bootstrap: bool,
    tool_bootstrap_timeout: int,
    emulator_avd: str,
    max_total_seconds: int,
) -> dict[str, Any]:
    deadline = time.time() + max_total_seconds if execute and max_total_seconds > 0 else None
    files = visible_files(root)
    candidates = package_candidates(root, files)
    readmes = readme_sources(root)
    gates = discover_gate_plans(root, candidates, readmes)
    environment_preparation: list[dict[str, Any]] = []
    if execute and tool_bootstrap:
        if deadline is not None:
            remaining = max(1, int(deadline - time.time()))
            tool_bootstrap_timeout = min(tool_bootstrap_timeout, remaining)
        environment_preparation = bootstrap_local_tools(root, gates, tool_bootstrap_timeout, emulator_avd)
    gates = execute_gates(root, gates, timeout, execute, deadline)
    blocker_items = blockers(gates)
    data = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "proof_mode": "executed" if execute else "planned_only",
        "max_total_seconds": max_total_seconds if execute else 0,
        "overall_status": overall_status(blocker_items),
        "environment_preparation": environment_preparation,
        "command_gates": gates,
        "gate_blockers": blocker_items,
    }
    write_json(output_dir / "release-build-agent-output.json", data)
    write_text(output_dir / "release-build-agent.zh.md", render_markdown(data))
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="运行 app 发布前核心工程门禁并生成报告。")
    parser.add_argument("--root", default=".", help="目标 app 项目根目录")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="报告输出目录")
    parser.add_argument("--timeout", type=int, default=300, help="单个命令超时时间，秒")
    parser.add_argument("--tool-bootstrap-timeout", type=int, default=180, help="本地工具准备等待时间，秒")
    parser.add_argument("--max-total-seconds", type=int, default=0, help="整轮执行最大预算，秒；0 表示不限制")
    parser.add_argument("--emulator-avd", default="", help="指定要自动启动的 Android AVD 名称")
    parser.add_argument("--no-tool-bootstrap", action="store_true", help="禁用 HBuilderX / Android 模拟器自动准备")
    parser.add_argument("--no-execute", action="store_true", help="只生成计划，不执行命令")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_dir = (root / args.output_dir).resolve() if not Path(args.output_dir).is_absolute() else Path(args.output_dir)
    data = generate(
        root,
        output_dir,
        args.timeout,
        execute=not args.no_execute,
        tool_bootstrap=not args.no_tool_bootstrap,
        tool_bootstrap_timeout=args.tool_bootstrap_timeout,
        emulator_avd=args.emulator_avd,
        max_total_seconds=args.max_total_seconds,
    )
    print(f"overall_status={data['overall_status']}")
    print(f"proof_mode={data['proof_mode']}")
    print(f"human_report={(output_dir / 'release-build-agent.zh.md').as_posix()}")
    print(f"machine_report={(output_dir / 'release-build-agent-output.json').as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
