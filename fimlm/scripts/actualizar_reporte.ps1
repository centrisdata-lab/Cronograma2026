<#
  Orquesta la actualizacion completa del reporte:
  1. Extrae datos frescos del dashboard (requiere que la ventana de Chrome
     dedicada, lanzada con iniciar_chrome_debug.ps1, siga abierta y logueada).
  2. Regenera index.html a partir de esos datos.

  Pensado para correr desatendido via el Programador de tareas de Windows.
  Uso:  powershell -File scripts\actualizar_reporte.ps1
#>

$scriptsDir = $PSScriptRoot
$logPath = Join-Path $scriptsDir "actualizar_reporte.log"

function Write-Log($msg) {
  $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  $msg"
  Add-Content -Path $logPath -Value $line
  Write-Output $line
}

Write-Log "=== Iniciando actualizacion ==="

try {
  $extraccion = & py "$scriptsDir\extraer_campus360.py" 2>&1
  $extraccion | ForEach-Object { Write-Log "  [extraer] $_" }
  if ($LASTEXITCODE -ne 0) {
    Write-Log "ABORTADO: la extraccion fallo (codigo $LASTEXITCODE). No se regenera el reporte."
    exit 1
  }
} catch {
  Write-Log "ABORTADO: excepcion durante la extraccion: $($_.Exception.Message)"
  exit 1
}

try {
  $build = & powershell -File "$scriptsDir\build_report.ps1" 2>&1
  $build | ForEach-Object { Write-Log "  [build] $_" }
  if ($LASTEXITCODE -ne 0) {
    Write-Log "ERROR: build_report.ps1 fallo (codigo $LASTEXITCODE)."
    exit 1
  }
} catch {
  Write-Log "ERROR: excepcion durante el build: $($_.Exception.Message)"
  exit 1
}

Write-Log "=== Actualizacion completada OK ==="
