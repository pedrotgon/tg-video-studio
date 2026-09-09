$ErrorActionPreference = 'Stop'
$studioRoot = Split-Path $PSScriptRoot -Parent
$runtimePath = Join-Path $studioRoot '.runtime'
New-Item -ItemType Directory -Path $runtimePath -Force | Out-Null
$env:ST_EDITION = 'ce'
$env:PYTHONUTF8 = '1'
$pythonPath = Join-Path $studioRoot 'engines/dramaclaw/.venv/Scripts/python.exe'
$nodePath = (Get-Command node).Source
$script:studioProcesses = @()
function Start-StudioService($serviceName, $port, $directory, $executable, $arguments) {
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) { return }
  $script:studioProcesses += Start-Process -FilePath $executable -ArgumentList $arguments -WorkingDirectory $directory -WindowStyle Hidden -RedirectStandardOutput "$runtimePath/$serviceName.log" -RedirectStandardError "$runtimePath/$serviceName-error.log" -PassThru
}
Start-StudioService 'creative-api' 8780 "$studioRoot/engines/dramaclaw" $pythonPath @('-m','uvicorn','novelvideo.api.wsgi:app','--host','127.0.0.1','--port','8780')
Start-StudioService 'gateway' 8000 $studioRoot $pythonPath @('-m','uvicorn','server.main:app','--host','127.0.0.1','--port','8000')
Start-StudioService 'creative-web' 5174 "$studioRoot/engines/dramaclaw/frontend" $nodePath @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5174','--mode','ce')
Start-StudioService 'studio-web' 5173 $studioRoot $nodePath @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173')
Write-Output 'TG Video Studio: http://127.0.0.1:5173/criativo/'
if ($script:studioProcesses.Count) { $script:studioProcesses | Wait-Process }
