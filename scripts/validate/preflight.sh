#!/bin/sh
set -eu

required_paths="
AGENTS.md
docs/STACK_DECISION.md
docs/MIGRATION_AUDIT.md
docs/TARGET_REPO_MAP.md
docs/WORKTREE_PLAN.md
docs/VALIDATION_MATRIX.md
docs/OUT_OF_SCOPE.md
docs/NEED_HUMAN.md
docs/NEXT_THREAD_PROMPT.md
pnpm-workspace.yaml
package.json
scripts/validate/preflight.ps1
scripts/validate/preflight.sh
apps/mobile/README.md
packages/core-contracts/README.md
packages/core-domain/README.md
packages/core-ui/README.md
infra/supabase/README.md
"

missing_count=0

for path in $required_paths; do
  if [ ! -e "$path" ]; then
    echo "MISSING $path"
    missing_count=$((missing_count + 1))
  fi
done

branch=""
if command -v git >/dev/null 2>&1; then
  branch="$(git branch --show-current 2>/dev/null || true)"
fi

on_protected_branch="false"
if [ "$branch" = "main" ] || [ "$branch" = "master" ]; then
  on_protected_branch="true"
fi

dirty_count=0
if command -v git >/dev/null 2>&1; then
  dirty_count="$(git status --short 2>/dev/null | wc -l | tr -d ' ')"
fi

dirty_on_protected_branch="false"
if [ "$on_protected_branch" = "true" ] && [ "$dirty_count" -ne 0 ]; then
  dirty_on_protected_branch="true"
fi

echo "cwd=$(pwd)"
echo "branch=$branch"
echo "on_protected_branch=$on_protected_branch"
echo "dirty_count=$dirty_count"
echo "dirty_on_protected_branch=$dirty_on_protected_branch"
echo "missing_count=$missing_count"

if [ ! -e ".git" ] || [ "$dirty_on_protected_branch" = "true" ] || [ "$missing_count" -ne 0 ]; then
  exit 1
fi
