# Iris Dial: installa o AGGIORNA l'app sull'orologio dal PC Windows. Per aggiornare basta rilanciarlo.
# Serve Node.js (https://nodejs.org, versione LTS). Lo script:
#   1. scarica da GitHub l'ultima versione di Iris Dial in %LOCALAPPDATA%\IrisDial\codice
#      (con -QuestaCartella usa invece il codice della cartella in cui si trova, utile per chi lo modifica);
#   2. prepara lo strumento ufficiale di Zepp (zeus) in una cartella sua, %LOCALAPPDATA%\IrisDial\zeus;
#   3. ti fa accedere al tuo account Zepp (si apre il browser, solo la prima volta);
#   4. compila e mostra un QR: inquadralo con l'app Zepp → Profilo → Impostazioni → Modalità sviluppatore → Scansiona.
# Uso: tasto destro su questo file → "Esegui con PowerShell", oppure da PowerShell:  .\tools\installa-sul-telefono.ps1
param([switch]$QuestaCartella)
$ErrorActionPreference = "Stop"
$progetto = Split-Path -Parent $PSScriptRoot
if (-not $QuestaCartella) {
  Write-Host "Scarico l'ultima versione di Iris Dial da GitHub…" -ForegroundColor Cyan
  $base = Join-Path $env:LOCALAPPDATA "IrisDial"
  New-Item -ItemType Directory -Force -Path $base | Out-Null
  $zip = Join-Path $base "codice.zip"
  Invoke-WebRequest -UseBasicParsing "https://github.com/Mark9712Seto/IrisDial/archive/refs/heads/main.zip" -OutFile $zip
  $dest = Join-Path $base "codice"
  if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
  Expand-Archive -Path $zip -DestinationPath $dest
  Remove-Item $zip
  $progetto = (Get-ChildItem $dest -Directory | Select-Object -First 1).FullName
  $versione = (Get-Content (Join-Path $progetto "app.json") -Raw | ConvertFrom-Json).app.version.name
  Write-Host "Versione scaricata: $versione" -ForegroundColor Green
}
$zeusDir = Join-Path $env:LOCALAPPDATA "IrisDial\zeus"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Manca Node.js: installalo da https://nodejs.org (versione LTS) e rilancia lo script." -ForegroundColor Red
  Read-Host "Premi Invio per chiudere"; exit 1
}

if (-not (Test-Path (Join-Path $zeusDir "node_modules\.bin\zeus.cmd"))) {
  Write-Host "Preparo lo strumento di Zepp (zeus)…" -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $zeusDir | Out-Null
  Push-Location $zeusDir
  '{"private":true}' | Set-Content package.json
  npm install --no-audit --no-fund "@zeppos/zeus-cli@1.9.3"
  # zeus porta con sé il modulo zeppos-app-utils: si usa quello (mai il pacchetto omonimo su npm, che non è di Zepp)
  $p = "node_modules\@zeppos\zeus-cli\private-modules\zeppos-app-utils"
  $deps = node -e "const d=require('./$($p -replace '\\','/')/package.json').dependencies||{};console.log(Object.entries(d).map(([k,v])=>k+'@'+v).join(' '))"
  npm install --no-audit --no-fund --no-save $deps.Split(' ')
  if (Test-Path node_modules\zeppos-app-utils) { Remove-Item -Recurse -Force node_modules\zeppos-app-utils }
  Copy-Item -Recurse $p node_modules\zeppos-app-utils
  Pop-Location
}
$zeus = Join-Path $zeusDir "node_modules\.bin\zeus.cmd"

Push-Location $progetto
Write-Host "Installo le dipendenze del progetto…" -ForegroundColor Cyan
npm install --no-audit --no-fund
$stato = & $zeus status 2>&1 | Out-String
if ($stato -notmatch "(?i)logged in|已登录|account") {
  Write-Host "Accedi al tuo account Zepp nel browser che si apre (lo stesso dell'app Zepp)." -ForegroundColor Cyan
  & $zeus login
}
Write-Host "Compilo e preparo il QR. Se chiede il dispositivo, scegli Amazfit Balance 2." -ForegroundColor Cyan
& $zeus preview
Pop-Location
Read-Host "Fatto. Premi Invio per chiudere"
