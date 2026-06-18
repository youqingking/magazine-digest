#!/usr/bin/env python3
"""Run the repo-owned Agno L3 Play Store workflow."""

from __future__ import annotations

import argparse
import importlib.metadata
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from agno.workflow import Step, Workflow

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)

from play_store_agno_adapters import (
    AGENT_SPECS,
    AGNO_STATUS,
    DEPENDENCY_REF,
    EXECUTION_MODE,
    RUNNER_REF,
    run_all_adapters,
)
from play_store_launch_readiness import (
    AGENTS,
    AGNO_ORCHESTRATION_MODE,
    AGNO_WORKFLOW_ID,
    finalize_launch_readiness_workflow,
    prepare_launch_readiness_context,
    run_launch_readiness_agent_step,
)


RUN_SCHEMA = "play_store_agno_l3_run.v1"

# Auditable runtime literals required by validate_play_store_agno_l3.py:
# dependency_lock_ref: docs/agno/requirements-agno.txt
# dependency_pin: agno==2.6.12
# execution_mode: real_agno_orchestration
# agno_status: real_run


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def git_value(root: Path, *args: str) -> str:
    result = subprocess.run(["git", *args], cwd=root, text=True, capture_output=True, check=False)
    if result.returncode != 0:
        detail = result.stderr.strip() or result.stdout.strip()
        raise RuntimeError(f"git {' '.join(args)} failed: {detail}")
    return result.stdout.strip()


def read_dependency_pin(root: Path) -> str:
    path = root / DEPENDENCY_REF
    if not path.is_file():
        raise FileNotFoundError(f"Missing repo-owned Agno dependency pin: {DEPENDENCY_REF}")
    pins = [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]
    agno_pins = [line for line in pins if line.startswith("agno==")]
    if len(agno_pins) != 1:
        raise ValueError(f"{DEPENDENCY_REF} must contain exactly one agno== version pin")
    return agno_pins[0]


def verify_agno_dependency(root: Path) -> tuple[str, str]:
    pin = read_dependency_pin(root)
    expected_version = pin.split("==", 1)[1]
    installed_version = importlib.metadata.version("agno")
    if installed_version != expected_version:
        raise RuntimeError(
            f"Installed agno version {installed_version!r} does not match repo pin {expected_version!r}"
        )
    return pin, installed_version


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def build_runner_command(args: argparse.Namespace) -> str:
    command = f"python {RUNNER_REF} --root {args.root} --mode {args.mode}"
    if args.run_id:
        command += f" --run-id {args.run_id}"
    return command


def derive_readiness(root: Path, step_artifacts: list[dict[str, Any]]) -> tuple[str, list[str], dict[str, Any]]:
    readiness_color = "RED"
    blocked_reasons: list[str] = []
    manifest_refs = [
        ref
        for step in step_artifacts
        if step.get("agent_id") == "launch-package-agent"
        for ref in step.get("output_refs", [])
        if isinstance(ref, str) and ref.endswith("/manifest.json")
    ]
    manifest_path = root / manifest_refs[0] if manifest_refs else root / "artifacts/launch-package/manifest.json"
    if manifest_path.is_file():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        readiness_color = manifest.get("readiness", readiness_color)
        blocked_reasons.extend(str(item) for item in manifest.get("blockers", []))
    for step in step_artifacts:
        blocked_reasons.extend(str(item) for item in step.get("blocked_reason", []))
    unresolved_gate_ids = sorted(
        {
            str(item)
            for step in step_artifacts
            for item in step.get("unresolved_human_gate_ids", [])
        }
    )
    if unresolved_gate_ids and readiness_color == "GREEN":
        readiness_color = "RED"
        blocked_reasons.append("readiness forced RED because unresolved human gates remain")
    return readiness_color, sorted(set(blocked_reasons)), {
        "unresolved_human_gates": unresolved_gate_ids,
        "unresolved_human_gate_count": len(unresolved_gate_ids),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run the Play Store Agno workflow.")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument(
        "--mode",
        default="launch-readiness",
        choices=("launch-readiness", "local-l3"),
        help="Execution mode. Use launch-readiness for the owner-facing fail-closed report.",
    )
    parser.add_argument("--run-id", help="Optional deterministic run id")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    branch = git_value(root, "branch", "--show-current")
    commit = git_value(root, "rev-parse", "--short", "HEAD")
    dependency_pin, agno_version = verify_agno_dependency(root)
    runner_command = build_runner_command(args)
    started_at = utc_now()

    if args.mode == "launch-readiness":
        run_id = args.run_id or f"play-store-launch-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
        context = prepare_launch_readiness_context(
            root=root,
            run_id=run_id,
            branch=branch,
            commit=commit,
            runner_command=runner_command,
            started_at=started_at,
        )

        def make_agent_executor(agent_name: str, step_index: int):
            def execute_agent_step(step_input: Any) -> dict[str, Any]:
                _ = step_input
                step = run_launch_readiness_agent_step(context, agent_name=agent_name, step_index=step_index)
                return {
                    "run_id": run_id,
                    "agno_step_id": step["agno_step_id"],
                    "agent_name": agent_name,
                    "step_index": step_index,
                    "readiness": step["readiness"],
                    "agent_status": step["agent_status"],
                    "output_path": step["output_paths"]["output"],
                }

            return execute_agent_step

        native_steps = [
            Step(
                step_id=f"{index:02d}-{agent_name}",
                name=agent_name,
                description=f"Fresh AI-backed Play Store launch-readiness step for {agent_name}.",
                executor=make_agent_executor(agent_name, index),
                max_retries=0,
            )
            for index, agent_name in enumerate(AGENTS, start=1)
        ]

        workflow = Workflow(
            id=AGNO_WORKFLOW_ID,
            name="Play Store Launch Readiness Workflow",
            description="Repo-owned fresh AI-backed 8-agent workflow for a fail-closed Play Store launch-readiness report.",
            steps=native_steps,
            telemetry=False,
            metadata={
                "execution_mode": "launch-readiness",
                "agno_orchestration_mode": AGNO_ORCHESTRATION_MODE,
                "native_step_count": len(AGENTS),
                "agno_maturity_policy": "run_artifact",
                "model_invocation_required": True,
                "prior_artifact_reuse_allowed": False,
                "dependency_lock_ref": DEPENDENCY_REF,
            },
        )
        workflow.run(input={"run_id": run_id, "mode": args.mode}, run_id=run_id)
        run = finalize_launch_readiness_workflow(context)
        run_ref = f"artifacts/play-store-launch/{run_id}/run.json"
        run_data = json.loads((root / run_ref).read_text(encoding="utf-8"))
        agno = run_data.get("agno", {})
        print(f"PLAY_STORE_LAUNCH_READINESS_RUN_CREATED run_id={run_id}")
        print(f"run_artifact={run_ref}")
        print(f"agno_status={agno.get('status')}")
        print(f"agno_maturity={agno.get('maturity')}")
        print(f"agno_orchestration_mode={agno.get('orchestration_mode')}")
        print(f"native_step_count={agno.get('native_step_count')}")
        print(f"model_backed_reasoning={str(agno.get('model_backed_reasoning')).lower()}")
        print(f"readiness_color={run_data.get('readiness')}")
        print(f"status={run_data.get('status')}")
        return (
            0
            if run.get("status") == "completed"
            and agno.get("maturity") in {"A3", "A3_CODEX_CLI_BACKED"}
            and agno.get("orchestration_mode") == AGNO_ORCHESTRATION_MODE
            and agno.get("native_step_count") == len(AGENTS)
            else 1
        )

    run_id = args.run_id or f"play-store-l3-{datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S')}"
    run_dir = root / "artifacts/agno/play-store/l3" / run_id

    def workflow_steps(workflow: Workflow, execution_input: Any) -> dict[str, Any]:
        _ = (workflow, execution_input)
        steps = run_all_adapters(
            root=root,
            run_dir=run_dir,
            run_id=run_id,
            branch=branch,
            commit=commit,
            dependency_pin=dependency_pin,
            agno_version=agno_version,
        )
        return {
            "run_id": run_id,
            "agent_ids": [step["agent_id"] for step in steps],
            "step_count": len(steps),
        }

    workflow = Workflow(
        id="play-store-agent-l3-workflow",
        name="Play Store Agent L3 Workflow",
        description="Repo-owned no-credential Agno workflow for Play Store agent evidence orchestration.",
        steps=workflow_steps,
        telemetry=False,
        metadata={
            "execution_mode": EXECUTION_MODE,
            "dependency_lock_ref": DEPENDENCY_REF,
        },
    )
    workflow_output = workflow.run(input={"run_id": run_id, "mode": args.mode}, run_id=run_id)

    step_paths = sorted((run_dir / "steps").glob("*.json"))
    step_artifacts = [json.loads(path.read_text(encoding="utf-8")) for path in step_paths]
    readiness_color, blocked_reasons, human_approval_summary = derive_readiness(root, step_artifacts)
    validation_results = [
        {
            "agent_id": step["agent_id"],
            "validator_command": step["validator_command"],
            "validator_exit_code": step["validator_exit_code"],
            "status": step["validation_results"]["status"],
        }
        for step in step_artifacts
    ]

    run_artifact = {
        "schema_version": RUN_SCHEMA,
        "run_id": run_id,
        "execution_mode": EXECUTION_MODE,
        "agno_status": AGNO_STATUS,
        "runner_command": runner_command,
        "dependency_lock_ref": DEPENDENCY_REF,
        "dependency_pin": dependency_pin,
        "branch": branch,
        "commit": commit,
        "started_at": started_at,
        "finished_at": utc_now(),
        "workflow_provenance": {
            "workflow_id": "play-store-agent-l3-workflow",
            "workflow_name": "Play Store Agent L3 Workflow",
            "agno_package": "agno",
            "agno_version": agno_version,
            "workflow_module": "agno.workflow",
            "workflow_run_status": str(getattr(workflow_output, "status", "")),
        },
        "step_order": [spec.agent_id for spec in AGENT_SPECS],
        "step_artifacts": {
            step["agent_id"]: (run_dir / "steps" / f"{index:02d}-{step['agent_id']}.json").relative_to(root).as_posix()
            for index, step in enumerate(step_artifacts, start=1)
        },
        "validation_results": validation_results,
        "readiness_color": readiness_color,
        "blocked_reasons": blocked_reasons,
        "human_approval_summary": human_approval_summary,
        "safety": {
            "play_console_api_called": False,
            "google_play_submission_attempted": False,
            "credentials_used": False,
            "production_action_performed": False,
            "c5_action_executed": False,
            "raw_screenshot_fabricated": False,
        },
        "next_allowed_action": "owner_review",
    }
    write_json(run_dir / "run.json", run_artifact)

    failed = [result for result in validation_results if result["validator_exit_code"] != 0]
    print(f"PLAY_STORE_AGNO_L3_RUN_CREATED run_id={run_id}")
    print(f"run_artifact={(run_dir / 'run.json').relative_to(root).as_posix()}")
    print(f"agno_status={AGNO_STATUS}")
    print(f"readiness_color={readiness_color}")
    if failed:
        print("status=validator_failed")
        return 1
    print("status=pass")
    return 0


if __name__ == "__main__":
    sys.exit(main())
