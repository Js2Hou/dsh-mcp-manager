<#
.SYNOPSIS
    One-click installer for dsh-mcp-manager (DeepSeek Harness web profile).

.DESCRIPTION
    Installs the plugin into ~/.dsh/profiles/web and auto-mounts it through
    the official `dsh plugin --profile web add` flow (npm package or a local
    checkout via link:). Idempotent — safe to re-run.

    Run from a local clone (installs that clone via link:):
        powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1

    Or for the published npm package (also the `irm | iex` path):
        powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -Package @js2hou/dsh-mcp-manager@0.1.0

.PARAMETER Package
    npm spec to install (default: dsh-mcp-manager). Ignored when a local
    checkout is detected (run from the repo) or -Path is given.

.PARAMETER Path
    Install from this local checkout instead of npm (link: spec).

.PARAMETER Restart
    Best-effort restart of the DSH desktop app after installing.

.PARAMETER DryRun
    Print the steps without executing them.

.EXAMPLE
    .\scripts\install.ps1 -Restart
#>
param(
    [string]$Package = '@js2hou/dsh-mcp-manager',
    [string]$Path = '',
    [switch]$Restart,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

function Step([string]$message) { Write-Host "[dsh-mcp-manager] $message" }
function Run([string]$exe, [string[]]$argsList) {
    if ($DryRun) {
        Step "DRY-RUN: $exe $($argsList -join ' ')"
        return
    }
    & $exe @argsList
    if ($LASTEXITCODE -ne 0) { throw "$exe failed with exit code $LASTEXITCODE" }
}

# --- Resolve the dsh CLI -----------------------------------------------
# Prefer the desktop app's bundled dsh (exact version match, offline, instant),
# then npx (the reference flow), then `dsh` on PATH as a last resort.
function Resolve-DshInvoke {
    $appCandidates = @()
    $proc = Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc -and $proc.Path) {
        $appCandidates += Join-Path (Split-Path (Split-Path $proc.Path)) 'resources\host\node_modules\@deepseek-ai\dsh\lib\bin.js'
    }
    $appCandidates += 'D:\ProgramFiles\DeepSeekHarness\DeepSeek Harness\resources\host\node_modules\@deepseek-ai\dsh\lib\bin.js'
    $appCandidates += "$env:LOCALAPPDATA\Programs\DeepSeek Harness\resources\host\node_modules\@deepseek-ai\dsh\lib\bin.js"
    foreach ($bin in $appCandidates) {
        if ($bin -and (Test-Path $bin)) { return @{ Kind = 'node'; Value = $bin } }
    }
    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if ($npx) { return @{ Kind = 'npx'; Value = $npx.Source } }
    $cmd = Get-Command dsh -ErrorAction SilentlyContinue
    if ($cmd) { return @{ Kind = 'cmd'; Value = $cmd.Source } }
    return $null
}

# --- Resolve install source ---------------------------------------------
$repoRoot = if ($Path -ne '') { (Resolve-Path $Path).Path } else { Split-Path -Parent $PSScriptRoot }
$isLocalRepo = $false
if (Test-Path (Join-Path $repoRoot 'package.json')) {
    try {
        $manifest = Get-Content (Join-Path $repoRoot 'package.json') -Raw | ConvertFrom-Json
        $isLocalRepo = $manifest.name -eq '@js2hou/dsh-mcp-manager'
    } catch { $isLocalRepo = $false }
}
$spec = if ($isLocalRepo) { "link:$repoRoot" } else { $Package }
$sourceLabel = if ($isLocalRepo) { "local checkout ($repoRoot)" } else { "npm package $Package" }

# --- Profile ------------------------------------------------------------
# Respect DSH_HOME when set (defaults to ~/.dsh).
$dshHome = if ($env:DSH_HOME -and $env:DSH_HOME.Trim() -ne '') { $env:DSH_HOME.Trim() } else { Join-Path $HOME '.dsh' }
$profileDir = Join-Path $dshHome 'profiles\web'
$patchFile = Join-Path $profileDir 'cordis.patch.yml'
$workspaceFile = Join-Path $profileDir 'pnpm-workspace.yaml'
$cleanup = Join-Path $PSScriptRoot 'remove-manual-mount.mjs'

Step "Installing from $sourceLabel"
Step "Target profile: $profileDir"
if (-not (Test-Path $profileDir)) {
    throw "Profile not found at $profileDir — run 'dsh web' once to initialize it, then re-run this script."
}

# 1. pnpm 11 minimum-release-age: a freshly published version is blocked for
#    the first 24h; exclude the package (idempotent merge).
if (-not $DryRun) {
    $ws = if (Test-Path $workspaceFile) { Get-Content $workspaceFile -Raw } else { '' }
    if ($ws -notmatch 'minimumReleaseAgeExclude') {
        $exclusion = "`nminimumReleaseAgeExclude:`n  - $Package`n"
        if ($ws.Trim() -eq '') {
            Set-Content -Path $workspaceFile -Value "packages:`n  - .`n`nnodeLinker: hoisted`nautoInstallPeers: false`n$exclusion" -Encoding UTF8
        } else {
            Add-Content -Path $workspaceFile -Value $exclusion -Encoding UTF8
        }
        Step "Added minimumReleaseAgeExclude for $Package to pnpm-workspace.yaml"
    }
}

# 2. Drop a stale manual mount row so bundle mounting can't double-mount.
if (Test-Path $patchFile) {
    if ($DryRun) { Step "DRY-RUN: node $cleanup $patchFile" } else { node $cleanup $patchFile }
}

# 3. Install + auto-mount through the official CLI (registers the dependency
#    and adds the package to dsh.profile.bundles via its dsh.bundle.patch).
$dsh = Resolve-DshInvoke
if ($null -eq $dsh) {
    throw 'No dsh CLI found — install Node.js ≥ 20 (npx) or add dsh to PATH.'
}
switch ($dsh.Kind) {
    'node' { Run 'node' @($dsh.Value, 'plugin', '--profile', 'web', 'add', $spec) }
    'cmd'  { Run $dsh.Value @('plugin', '--profile', 'web', 'add', $spec) }
    'npx'  { Run 'npx' @('-y', '--package', '@deepseek-ai/dsh', 'dsh', 'plugin', '--profile', 'web', 'add', $spec) }
}

Step "Installed: $spec"
Step 'Hard-refresh the browser (Ctrl+Shift+R) and open Settings → MCP.'
if ($isLocalRepo) {
    Step 'Local-checkout note: rebuilding the plugin (pnpm build) hot-reloads the client bundle on refresh; host changes need a DSH restart.'
}

# 4. Optional restart of the desktop app (best effort).
if ($Restart) {
    $exe = $null
    $candidates = @(
        (Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Path),
        "$env:LOCALAPPDATA\Programs\DeepSeek Harness\DeepSeek Harness.exe",
        'D:\ProgramFiles\DeepSeekHarness\DeepSeek Harness\DeepSeek Harness.exe'
    )
    foreach ($c in $candidates) { if ($c -and (Test-Path $c)) { $exe = $c; break } }
    if ($exe) {
        if ($DryRun) { Step "DRY-RUN: restart $exe" } else {
            Get-Process 'DeepSeek Harness' -ErrorAction SilentlyContinue | Stop-Process -Force
            Start-Sleep -Seconds 2
            Start-Process -FilePath $exe
            Step 'DSH restarted.'
        }
    } else {
        Write-Warning 'Could not locate DeepSeek Harness.exe — restart it manually after installing.'
    }
}
