param(
  [switch]$InstallDeps
)

$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $repoRoot

function Import-DotEnv {
  param([string]$Path)

  if (-not (Test-Path $Path)) {
    Write-Host "[start-all] .env not found at $Path"
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) {
      return
    }

    $parts = $line.Split('=', 2)
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    Set-Item -Path "Env:$key" -Value $value
  }
}

Import-DotEnv -Path (Join-Path $repoRoot '.env')

if (-not $env:PI_STREAM_URL) {
  $env:PI_STREAM_URL = 'http://10.199.140.197:8080/stream.mjpg'
}
if (-not $env:LOCAL_DETECTOR_PORT) {
  $env:LOCAL_DETECTOR_PORT = '8080'
}
if (-not $env:AI_THEFT_CAMERA_ID) {
  $env:AI_THEFT_CAMERA_ID = 'pi-cam-1'
}
if (-not $env:VITE_APP_API_BASE_URL) {
  $env:VITE_APP_API_BASE_URL = 'http://127.0.0.1:8787'
}

$bridgePort = if ($env:ALERT_SERVER_PORT) { [int]$env:ALERT_SERVER_PORT } else { 8787 }
$bridgeListener = Get-NetTCPConnection -LocalPort $bridgePort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$bridgeProcess = $null
$bridgeAlreadyRunning = $false

if ($bridgeListener) {
  $bridgeProcessId = $bridgeListener.OwningProcess
  $bridgeProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$bridgeProcessId" -ErrorAction SilentlyContinue
  $bridgeCmd = if ($bridgeProcess) { ($bridgeProcess.CommandLine | Out-String).Trim() } else { '' }

  if ($bridgeCmd -match 'ai-theft-bridge\.js') {
    $bridgeAlreadyRunning = $true
    Write-Host "[start-all] Bridge already running on port $bridgePort (pid $bridgeProcessId). Reusing existing process."
  } else {
    Write-Host "[start-all] Port $bridgePort is in use by another process."
    if ($bridgeProcess) {
      Write-Host "[start-all] Process: $($bridgeProcess.Name) (pid $bridgeProcessId)"
      Write-Host "[start-all] Command: $bridgeCmd"
    }
    Write-Host "[start-all] Set ALERT_SERVER_PORT and VITE_APP_API_BASE_URL in .env to a free port, then retry."
    exit 1
  }
}

$bridgeEventUrl = "$($env:VITE_APP_API_BASE_URL.TrimEnd('/'))/api/ai-theft/event"
$detectorPort = [int]$env:LOCAL_DETECTOR_PORT
$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
  Write-Host '[start-all] Creating Python virtual environment...'
  python -m venv .venv
}

$venvPython = Join-Path $repoRoot '.venv\Scripts\python.exe'

if ($InstallDeps) {
  Write-Host '[start-all] Installing Node dependencies...'
  npm install

  Write-Host '[start-all] Installing detector dependencies...'
  & $venvPython -m pip install --upgrade pip
  & $venvPython -m pip install -r raspberry-pi/requirements-detector.txt
}

$launchItems = @()

if (-not $bridgeAlreadyRunning) {
  $launchItems += @{
    Label = 'CyberChaukidaar-Bridge'
    Command = 'npm run ai-alerts'
  }
}

$launchItems += @{
  Label = 'CyberChaukidaar-Web'
  Command = 'npm run dev'
}

$launchItems += @{
  Label = 'CyberChaukidaar-Detector'
  Command = "& '$venvPython' raspberry-pi/yolov8n_theft_detector.py --camera-source '$($env:PI_STREAM_URL)' --camera-id '$($env:AI_THEFT_CAMERA_ID)' --bridge-url '$bridgeEventUrl' --stream-host 0.0.0.0 --stream-port $detectorPort --detection-log-interval-seconds 2 --min-streak-frames 8"
}

for ($i = 0; $i -lt $launchItems.Count; $i++) {
  $label = $launchItems[$i].Label
  $command = $launchItems[$i].Command

  $startupCommand = "`$host.UI.RawUI.WindowTitle = '$label'; $command"
  Start-Process -FilePath 'powershell' -WorkingDirectory $repoRoot -ArgumentList @('-NoExit', '-Command', $startupCommand) | Out-Null
}

Write-Host '[start-all] Started services in new PowerShell windows.'
Write-Host "[start-all] PI_STREAM_URL=$($env:PI_STREAM_URL)"
Write-Host "[start-all] Detector output stream: http://127.0.0.1:$detectorPort/stream.mjpg"
Write-Host "[start-all] Bridge base URL: $($env:VITE_APP_API_BASE_URL)"
