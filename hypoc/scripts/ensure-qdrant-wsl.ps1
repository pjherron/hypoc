# Ensures a Qdrant vector-store process is running and reachable at
# http://localhost:6333 on Windows, using WSL2 as the Linux host.
#
# Qdrant publishes no native Windows binary (see bin/install's platform
# switch: only Darwin-*/Linux-* assets exist). WSL2 shares localhost with
# Windows by default, so the official Linux-x86_64 release running inside
# any WSL2 distro is transparently reachable from Windows at
# http://localhost:6333 with zero extra networking config.
#
# Idempotent and safe to call on every hypoc launch (via hypoc.cmd) and
# during install (bin/install.ps1): no-ops if already running, installs
# the binary into the WSL distro's home on first run, otherwise just
# (re)starts the background process.

param(
  [string]$Distro = ""
)

function Test-QdrantUp {
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:6333/" -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

if (Test-QdrantUp) {
  Write-Host "[hypoc] qdrant: already running (localhost:6333)"
  exit 0
}

$wslAvailable = $false
try {
  wsl.exe --status *> $null
  $wslAvailable = ($LASTEXITCODE -eq 0)
} catch {
  $wslAvailable = $false
}

if (-not $wslAvailable) {
  Write-Host "[hypoc] qdrant: WSL2 not available; memory recall (vector search) will be unavailable." -ForegroundColor Yellow
  Write-Host "[hypoc] qdrant: install WSL2 with 'wsl --install' to enable it, then re-run." -ForegroundColor Yellow
  exit 0
}

if (-not $Distro) {
  $lines = (wsl.exe -l -q) 2>$null
  $Distro = ($lines | Where-Object { $_ -and ($_ -replace "`0", "").Trim() -ne "" } | Select-Object -First 1) -replace "`0", ""
  $Distro = $Distro.Trim()
}

if (-not $Distro) {
  Write-Host "[hypoc] qdrant: no WSL distro found; run 'wsl --install -d Ubuntu' then re-run." -ForegroundColor Yellow
  exit 0
}

# Installs the qdrant binary into the WSL distro on first run (repo-local
# to the WSL user's home, independent of the Windows-side hypoc checkout),
# then (re)starts it in the background, detached from this shell.
#
# Written to a temp file rather than passed inline: `wsl.exe -- bash -c
# "<multi-line string>"` mangles quoting/newlines when PowerShell marshals
# the argument to a native exe, causing bash syntax errors.
$remoteScript = @'
set -e
QDIR="$HOME/.hypoc/qdrant"
mkdir -p "$QDIR"
if [ ! -x "$QDIR/qdrant" ]; then
  echo "[hypoc] qdrant: installing into WSL ($QDIR)..."
  tmp=$(mktemp -d)
  curl -fsSL -o "$tmp/qdrant.tar.gz" "https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz"
  tar -xzf "$tmp/qdrant.tar.gz" -C "$QDIR"
  chmod +x "$QDIR/qdrant"
  rm -rf "$tmp"
fi
if ! curl -sf --max-time 2 http://localhost:6333/ >/dev/null 2>&1; then
  cd "$QDIR"
  # setsid detaches into a new session, independent of the invoking wsl.exe
  # command's process group. Without it, WSL kills background (`&`/nohup)
  # children once the `wsl.exe -- ...` invocation that spawned them exits.
  # The short sleep gives the detached process time to fully re-parent
  # before this script (and the wsl.exe call that ran it) returns --
  # without it, WSL tears the child down before detach completes.
  QDRANT__STORAGE__STORAGE_PATH="$QDIR/storage" setsid nohup ./qdrant --disable-telemetry </dev/null > "$QDIR/qdrant.log" 2>&1 &
  disown
  sleep 1
fi
'@

$tmpWin = Join-Path $env:TEMP "hypoc-ensure-qdrant.sh"
[System.IO.File]::WriteAllText($tmpWin, ($remoteScript -replace "`r`n", "`n"), [System.Text.UTF8Encoding]::new($false))
# Build the /mnt/<drive>/... WSL path directly rather than round-tripping
# through `wslpath` as a native-exe argument, which strips backslashes.
$drive = $tmpWin.Substring(0, 1).ToLower()
$rest = $tmpWin.Substring(2) -replace '\\', '/'
$tmpWsl = "/mnt/$drive$rest"
wsl.exe -d $Distro -- bash $tmpWsl
Remove-Item -Force $tmpWin -ErrorAction SilentlyContinue

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500
  if (Test-QdrantUp) { $ready = $true; break }
}

if ($ready) {
  Write-Host "[hypoc] qdrant: running via WSL ($Distro), reachable at localhost:6333"
} else {
  Write-Host "[hypoc] qdrant: did not become ready via WSL ($Distro); memory recall will be degraded until it is." -ForegroundColor Yellow
}
