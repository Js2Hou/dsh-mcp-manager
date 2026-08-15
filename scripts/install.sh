#!/usr/bin/env bash
#
# One-click installer for dsh-mcp-manager (DeepSeek Harness web profile).
# Idempotent — safe to re-run.
#
# Run from a local clone (installs that clone via link:):
#   bash scripts/install.sh
#
# Or for the published npm package (also the curl | bash path):
#   bash scripts/install.sh dsh-mcp-manager@0.1.0
#
# Flags: --restart (best-effort relaunch of the desktop app), --dry-run.
set -euo pipefail

PACKAGE="${1:-@js2hou/dsh-mcp-manager}"
RESTART=0
DRY_RUN=0
for arg in "${@:2}"; do
  case "$arg" in
    --restart) RESTART=1 ;;
    --dry-run) DRY_RUN=1 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
PROFILE_DIR="${DSH_HOME:-$HOME/.dsh}/profiles/web"
PATCH_FILE="$PROFILE_DIR/cordis.patch.yml"
WORKSPACE_FILE="$PROFILE_DIR/pnpm-workspace.yaml"
CLEANUP="$SCRIPT_DIR/remove-manual-mount.mjs"

step() { echo "[dsh-mcp-manager] $*"; }
run() {
  if [ "$DRY_RUN" -eq 1 ]; then step "DRY-RUN: $*"; return 0; fi
  "$@"
}

# Resolve the dsh CLI: prefer the desktop app's bundled dsh (exact version
# match, offline), then npx, then `dsh` on PATH. Prints "kind:value".
resolve_dsh() {
  local candidates=(
    "/Applications/DeepSeek Harness.app/Contents/Resources/host/node_modules/@deepseek-ai/dsh/lib/bin.js"
  )
  local bin
  for bin in "${candidates[@]}"; do
    if [ -f "$bin" ]; then echo "node:$bin"; return 0; fi
  done
  if command -v npx >/dev/null 2>&1; then echo "npx:"; return 0; fi
  if command -v dsh >/dev/null 2>&1; then echo "cmd:dsh"; return 0; fi
  return 1
}

# --- Resolve install source -------------------------------------------------
IS_LOCAL_REPO=0
if [ -f "$REPO_ROOT/package.json" ]; then
  NAME="$(node -e "process.stdout.write(require('$REPO_ROOT/package.json').name || '')" 2>/dev/null || true)"
  [ "$NAME" = "@js2hou/dsh-mcp-manager" ] && IS_LOCAL_REPO=1
fi
if [ "$IS_LOCAL_REPO" -eq 1 ]; then
  SPEC="link:$REPO_ROOT"
  SOURCE_LABEL="local checkout ($REPO_ROOT)"
else
  SPEC="$PACKAGE"
  SOURCE_LABEL="npm package $PACKAGE"
fi

step "Installing from $SOURCE_LABEL"
step "Target profile: $PROFILE_DIR"
if [ ! -d "$PROFILE_DIR" ]; then
  echo "[dsh-mcp-manager] Profile not found at $PROFILE_DIR — run 'dsh web' once to initialize it, then re-run." >&2
  exit 1
fi

# 1. pnpm 11 minimum-release-age: freshly published versions are blocked for
#    the first 24h; exclude the package (idempotent merge).
if ! grep -q 'minimumReleaseAgeExclude' "$WORKSPACE_FILE" 2>/dev/null; then
  if [ "$DRY_RUN" -eq 1 ]; then
    step "DRY-RUN: append minimumReleaseAgeExclude for $PACKAGE to pnpm-workspace.yaml"
  else
    printf '\nminimumReleaseAgeExclude:\n  - %s\n' "$PACKAGE" >> "$WORKSPACE_FILE"
    step "Added minimumReleaseAgeExclude for $PACKAGE to pnpm-workspace.yaml"
  fi
fi

# 2. Drop a stale manual mount row so bundle mounting can't double-mount.
if [ -f "$PATCH_FILE" ]; then
  run node "$CLEANUP" "$PATCH_FILE"
fi

# 3. Install + auto-mount through the official CLI (registers the dependency
#    and adds the package to dsh.profile.bundles via its dsh.bundle.patch).
DSH_INVOKE="$(resolve_dsh || true)"
if [ -z "$DSH_INVOKE" ]; then
  echo "[dsh-mcp-manager] No dsh CLI found — install Node.js >= 20 (npx) or add dsh to PATH." >&2
  exit 1
fi
case "${DSH_INVOKE%%:*}" in
  node) run node "${DSH_INVOKE#*:}" plugin --profile web add "$SPEC" ;;
  cmd)  run dsh plugin --profile web add "$SPEC" ;;
  npx)  run npx -y --package @deepseek-ai/dsh dsh plugin --profile web add "$SPEC" ;;
esac

step "Installed: $SPEC"
step 'Hard-refresh the browser (Cmd/Ctrl+Shift+R) and open Settings → MCP.'
if [ "$IS_LOCAL_REPO" -eq 1 ]; then
  step 'Local-checkout note: rebuilding the plugin (pnpm build) hot-reloads the client bundle on refresh; host changes need a DSH restart.'
fi

# 4. Optional restart of the desktop app (best effort).
if [ "$RESTART" -eq 1 ]; then
  if [ "$DRY_RUN" -eq 1 ]; then
    step "DRY-RUN: restart DeepSeek Harness"
  else
    pkill -f 'DeepSeek Harness' 2>/dev/null || true
    sleep 2
    if command -v open >/dev/null 2>&1; then
      open -a 'DeepSeek Harness' 2>/dev/null && step 'DSH restarted.' || echo '[dsh-mcp-manager] restart DSH manually.' >&2
    else
      echo '[dsh-mcp-manager] restart DSH manually.' >&2
    fi
  fi
fi
