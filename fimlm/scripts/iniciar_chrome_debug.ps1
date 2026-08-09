<#
  Lanza Chrome con el puerto de depuracion remota habilitado, usando un perfil
  SEPARADO (no tu perfil normal) para no interferir con tu uso diario de Chrome.

  La primera vez que lo corras, Chrome abrira "en blanco" con ese perfil nuevo:
  tendras que iniciar sesion en registros.fimlm.org una vez (con el OTP) en ESA
  ventana. Mientras esa ventana quede abierta, extraer_campus360.py podra
  conectarse a ella y usar la sesion ya iniciada.

  Uso:  powershell -File scripts\iniciar_chrome_debug.ps1
#>

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$debugPort = 9222
$profileDir = Join-Path $env:LOCALAPPDATA "ChromeDebugCampus360"

if (-not (Test-Path $chromePath)) {
  throw "No se encontro Chrome en $chromePath. Ajusta la ruta en este script."
}

if (-not (Test-Path $profileDir)) {
  New-Item -ItemType Directory -Path $profileDir | Out-Null
}

Write-Output "Abriendo Chrome con depuracion remota en el puerto $debugPort..."
Write-Output "Perfil separado en: $profileDir"
Write-Output ""
Write-Output "IMPORTANTE: deja esta ventana de Chrome abierta siempre."
Write-Output "La primera vez, inicia sesion manualmente en registros.fimlm.org/campus/dashboard"

Start-Process -FilePath $chromePath -ArgumentList @(
  "--remote-debugging-port=$debugPort",
  "--user-data-dir=`"$profileDir`"",
  "--no-first-run",
  "--no-default-browser-check",
  "https://registros.fimlm.org/campus/dashboard/"
)
