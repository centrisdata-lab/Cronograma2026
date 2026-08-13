<#
  Regenera index.html a partir de un solo archivo: data\FIMLM_Colombia_6_zonas_completo.csv
  (tres secciones en el mismo CSV: RESUMEN POR ZONA / DETALLE DE CURSOS POR ZONA / DETALLE DE GRUPOS POR CURSO)
  Uso:  powershell -File scripts\build_report.ps1
#>

$root = Split-Path -Parent $PSScriptRoot
if (-not $root) { $root = (Get-Item "$PSScriptRoot\..").FullName }
$dataDir = Join-Path $root "data"
$scriptsDir = Join-Path $root "scripts"

$dataPath = Join-Path $dataDir "FIMLM_Colombia_6_zonas_completo.csv"
$prevDataPath = Join-Path $dataDir "FIMLM_Colombia_6_zonas_anterior.csv"
$templatePath = Join-Path $scriptsDir "report_template.html"
$outPath = Join-Path $root "index.html"

foreach ($p in @($dataPath, $templatePath)) {
  if (-not (Test-Path $p)) { throw "No se encontró el archivo esperado: $p" }
}

# Nombre, icono y color de cada zona salen de la fuente unica compartida con la
# app y el Informe Nacional (data/zonas.json en la raiz del repo). Antes estaban
# escritos aqui a mano y se desincronizaban con el resto de la app.
$zonasJsonPath = Join-Path (Split-Path -Parent $root) "data\zonas.json"
if (-not (Test-Path $zonasJsonPath)) { throw "No se encontró la fuente de zonas: $zonasJsonPath" }
$zonasCanonicas = (Get-Content -Path $zonasJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json).zonas

$zoneNames = @{}
$zoneIcon  = @{}
$zoneColor = @{}
foreach ($z in $zonasCanonicas) {
  $zoneNames[$z.codigoFimlm] = $z.nombre
  $zoneIcon[$z.codigoFimlm]  = $z.emoji
  $zoneColor[$z.codigoFimlm] = $z.color
}

function Normalize-Key([string]$raw) {
  # Comparación robusta ante tildes/codificación: quita diacríticos y deja solo A-Z0-9.
  $formD = $raw.Normalize([System.Text.NormalizationForm]::FormD)
  $stripped = -join ($formD.ToCharArray() | Where-Object { [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($_) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark })
  return ($stripped.ToUpperInvariant() -replace '[^A-Z0-9]', '')
}

# Palabras que identifican a cada zona, derivadas de su nombre y sus
# departamentos en data/zonas.json. Sirven para reconocer la zona sin importar
# como venga escrita en el CSV (con o sin tildes, con "Zona" adelante, con el
# nombre anterior de una zona que se renombro, etc.).
$zonePatterns = @{}
foreach ($z in $zonasCanonicas) {
  $claves = New-Object System.Collections.Generic.List[string]
  # Del nombre: cada palabra significativa (descarta "Zona", "y", "&", "de"...).
  foreach ($palabra in ($z.nombre -split '[\s&,]+')) {
    $k = Normalize-Key $palabra
    if ($k.Length -ge 4 -and $k -ne 'ZONA') { $claves.Add($k) }
  }
  # De los departamentos: los nombres compuestos ayudan a desambiguar.
  foreach ($dep in $z.departamentos) {
    $k = Normalize-Key $dep
    if ($k.Length -ge 5) { $claves.Add($k) }
  }
  $zonePatterns[$z.codigoFimlm] = $claves
}

function Get-ZoneCode([string]$raw) {
  $key = Normalize-Key $raw
  if (-not $key) { return $null }
  # Primero, coincidencia por nombre/departamento propio de cada zona.
  foreach ($codigo in $zonePatterns.Keys) {
    foreach ($patron in $zonePatterns[$codigo]) {
      if ($key -like "*$patron*") { return $codigo }
    }
  }
  return $null
}

# ---------- Partir el archivo único en sus 3 secciones ----------
function Get-SectionBlock([string[]]$lines, [string]$startMarker, [string[]]$stopMarkers) {
  $startIdx = $null
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Trim() -eq $startMarker) { $startIdx = $i; break }
  }
  if ($null -eq $startIdx) { throw "No se encontró la sección '$startMarker' en $dataPath" }

  $endIdx = $lines.Count
  for ($i = $startIdx + 1; $i -lt $lines.Count; $i++) {
    if ($stopMarkers -contains $lines[$i].Trim()) { $endIdx = $i; break }
  }

  $block = $lines[($startIdx+1)..($endIdx-1)]
  while ($block.Count -gt 0 -and [string]::IsNullOrWhiteSpace($block[0])) { $block = $block[1..($block.Count-1)] }
  while ($block.Count -gt 0 -and [string]::IsNullOrWhiteSpace($block[-1])) { $block = $block[0..($block.Count-2)] }
  return $block
}

# Lee el valor "corte_datos" de la Seccion 7 (Metadatos) de un CSV con el mismo
# formato multi-seccion. Si no existe esa seccion, cae a la fecha de modificacion
# del archivo como aproximacion.
function Get-CorteDatos([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  $raw = (Get-Content -Path $path -Raw -Encoding UTF8).TrimStart([char]0xFEFF)
  $ls = $raw -replace "`r`n","`n" -split "`n"
  $has7 = ($ls | Where-Object { $_.Trim() -eq "SECCION 7 - METADATOS" }).Count -gt 0
  if ($has7) {
    try {
      $block = Get-SectionBlock $ls "SECCION 7 - METADATOS" @()
      $row = ($block | ConvertFrom-Csv) | Where-Object { $_.Clave -eq "corte_datos" } | Select-Object -First 1
      if ($row) { return $row.Valor }
    } catch {}
  }
  return (Get-Item $path).LastWriteTime.ToString("yyyy-MM-ddTHH:mm:sszzz")
}

$rawText = (Get-Content -Path $dataPath -Raw -Encoding UTF8).TrimStart([char]0xFEFF)
$lines = $rawText -replace "`r`n","`n" -split "`n"

$hasSeccion5 = ($lines | Where-Object { $_.Trim() -eq "SECCION 5 - OTROS DATOS GLOBALES" }).Count -gt 0
$hasSeccion6 = ($lines | Where-Object { $_.Trim() -eq "SECCION 6 - IGLESIAS CON INSCRIPCION (COLOMBIA)" }).Count -gt 0
$allMarkers = @("SECCION 2 - DETALLE DE CURSOS POR ZONA","SECCION 3 - DETALLE DE GRUPOS POR CURSO","SECCION 4 - IGLESIAS SIN MATRICULA","SECCION 5 - OTROS DATOS GLOBALES","SECCION 6 - IGLESIAS CON INSCRIPCION (COLOMBIA)","SECCION 7 - METADATOS")

$resumenLines   = Get-SectionBlock $lines "SECCION 1 - RESUMEN POR ZONA" $allMarkers
$cursosLines    = Get-SectionBlock $lines "SECCION 2 - DETALLE DE CURSOS POR ZONA" $allMarkers
$gruposLines    = Get-SectionBlock $lines "SECCION 3 - DETALLE DE GRUPOS POR CURSO" $allMarkers
$iglesiasLines  = Get-SectionBlock $lines "SECCION 4 - IGLESIAS SIN MATRICULA" $allMarkers
$otrosLines     = if ($hasSeccion5) { Get-SectionBlock $lines "SECCION 5 - OTROS DATOS GLOBALES" $allMarkers } else { @() }
$iglInscLines   = if ($hasSeccion6) { Get-SectionBlock $lines "SECCION 6 - IGLESIAS CON INSCRIPCION (COLOMBIA)" $allMarkers } else { @() }

# --- Zonas (resumen) ---
$resumen = $resumenLines | ConvertFrom-Csv
$zonas = @()
foreach ($r in $resumen) {
  if ($r.Zona -like "Total*") { continue }
  $code = Get-ZoneCode $r.Zona
  if (-not $code) { Write-Warning "Zona sin mapear en resumen: '$($r.Zona)'"; continue }
  $zonas += [ordered]@{
    code=$code; name=$zoneNames[$code]; icon=$zoneIcon[$code]; color=$zoneColor[$code]
    mat=[int]$r.Matriculas; per=[int]$r.Personas; cap=[int]$r."Capacidad (meta)"
    disp=[int]$r."Cupos disponibles"; ocu=[double]$r."Ocupacion (%)"
    cur=[int]$r.Cursos; grp=[int]$r.Grupos; esp=[int]$r."En espera"; bajo=[int]$r."Cursos baja ocupacion (<30%)"
  }
}

# --- Cursos ---
$cursosRaw = $cursosLines | ConvertFrom-Csv
$cursos = @()
foreach ($c in $cursosRaw) {
  $code = Get-ZoneCode $c.Zona
  if (-not $code) { Write-Warning "Zona sin mapear en cursos: '$($c.Zona)'"; continue }
  $cursos += [ordered]@{
    z=$code; cod=$c.Codigo; nom=$c.Curso
    grp=[int]$c.Grupos; cap=[int]$c.Capacidad; mat=[int]$c.Matriculados
    disp=[int]$c.Disponibles; llenos=[int]$c."Grupos llenos"; esp=[int]$c."En espera"
  }
}

# --- Grupos ---
$gruposRaw = $gruposLines | ConvertFrom-Csv
$grupos = @()
foreach ($g in $gruposRaw) {
  $code = Get-ZoneCode $g.Zona
  if (-not $code) { Write-Warning "Zona sin mapear en grupos: '$($g.Zona)'"; continue }
  $grupos += [ordered]@{
    z=$code; cod=$g.Codigo; nom=$g.Curso; g=$g.Grupo
    h=$g.Horario; cap=[int]$g.Capacidad; mat=[int]$g.Matriculados; esp=[int]$g."En espera"
  }
}

# --- Boletines: historial de novedades por corte (generados por extraer_campus360.py) ---
$boletinesDir = Join-Path $dataDir "boletines"
$boletines = @()
if (Test-Path $boletinesDir) {
  $archivosBoletin = Get-ChildItem -Path $boletinesDir -Filter "*.json" | Sort-Object Name -Descending
  foreach ($f in $archivosBoletin) {
    try {
      $b = Get-Content -Path $f.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
      $novs = @()
      foreach ($n in @($b.novedades)) {
        $code = Get-ZoneCode $n.z
        $novs += [ordered]@{
          z=$(if($code){$code}else{$n.z}); cod=$n.cod; nom=$n.nom; g=$n.g
          matAntes=[int]$n.matAntes; matAhora=[int]$n.matAhora; delta=[int]$n.delta
        }
      }
      $boletines += [ordered]@{ corte=$b.corte; novedades=$novs }
    } catch { Write-Warning "No se pudo leer el boletin '$($f.Name)': $($_.Exception.Message)" }
  }
}
# Total de novedades del boletin mas reciente (para el badge de la campana)
$novedades = if ($boletines.Count -gt 0) { @($boletines[0].novedades) } else { @() }

# --- Iglesias sin matricula ---
# La columna "Zona" trae la zona real desde extraer_campus360.py. Los CSV
# generados antes de ese cambio traen el texto fijo "Todas (6 zonas)": en ese
# caso se deja vacia para que el informe agrupe solo por departamento, en vez
# de inventar una zona falsa. Asi una corrida automatica con el CSV viejo no
# rompe el informe mientras se despliega el cambio.
# Normaliza el nombre de zona del CSV al nombre canonico de data/zonas.json.
# El CSV puede traer una variante anterior ("Caribe" en vez de "Zona Caribe",
# "Santanderes & Boyaca" antes del renombre); Get-ZoneCode las reconoce todas,
# y asi el informe recibe siempre el nombre actual y no tiene que adivinar.
function Get-ZonaCanonica([string]$raw) {
  if (-not $raw -or $raw -like "Todas*") { return "" }
  $codigo = Get-ZoneCode $raw
  if ($codigo -and $zoneNames.ContainsKey($codigo)) { return $zoneNames[$codigo] }
  return $raw
}

$iglesiasRaw = $iglesiasLines | ConvertFrom-Csv
$iglesias = @()
foreach ($i in $iglesiasRaw) {
  $iglesias += [ordered]@{
    zona=(Get-ZonaCanonica $i.Zona); dep=$i.Departamento; nom=$i.Iglesia; mat=[int]$i.Matriculados
  }
}

# --- Otros datos (genero, edad, etnia, discapacidad; globales, no filtrados por zona) ---
$otros = @()
if ($otrosLines.Count -gt 0) {
  $otrosRaw = $otrosLines | ConvertFrom-Csv
  foreach ($o in $otrosRaw) {
    $otros += [ordered]@{ cat=$o.Categoria; lbl=$o.Etiqueta; val=[int]$o.Valor }
  }
}

# --- Iglesias con inscripcion (Colombia, global - no filtrado a 6 zonas) ---
# La columna "Zona" se agrego junto con la de la seccion 4; los CSV anteriores
# no la traen (ConvertFrom-Csv devuelve $null) y en ese caso queda vacia.
$iglesiasInsc = @()
if ($iglInscLines.Count -gt 0) {
  $iglInscRaw = $iglInscLines | ConvertFrom-Csv
  foreach ($i in $iglInscRaw) {
    $zonaInsc = if ($i.PSObject.Properties.Name -contains "Zona") { Get-ZonaCanonica $i.Zona } else { "" }
    $iglesiasInsc += [ordered]@{ zona=$zonaInsc; dep=$i.Departamento; nom=$i.Iglesia; ins=[int]$i.Inscritos }
  }
}

# --- Metadatos (hora exacta de corte de los datos, actual y del corte anterior) ---
$corteDatos = Get-CorteDatos $dataPath
$corteAnterior = Get-CorteDatos $prevDataPath

$zonasJson = ($zonas | ConvertTo-Json -Depth 5 -Compress)
$cursosJson = ($cursos | ConvertTo-Json -Depth 5 -Compress)
$gruposJson = ($grupos | ConvertTo-Json -Depth 5 -Compress)
$iglesiasJson = ($iglesias | ConvertTo-Json -Depth 5 -Compress)
$otrosJson = ($otros | ConvertTo-Json -Depth 5 -Compress)
if ($otros.Count -eq 0) { $otrosJson = "[]" }
if ($otros.Count -eq 1) { $otrosJson = "[$otrosJson]" }
$iglesiasInscJson = ($iglesiasInsc | ConvertTo-Json -Depth 5 -Compress)
if ($iglesiasInsc.Count -eq 0) { $iglesiasInscJson = "[]" }
if ($iglesiasInsc.Count -eq 1) { $iglesiasInscJson = "[$iglesiasInscJson]" }
$corteJson = $corteDatos | ConvertTo-Json -Compress
$corteAnteriorJson = if ($corteAnterior) { $corteAnterior | ConvertTo-Json -Compress } else { "null" }
$boletinesJson = ($boletines | ConvertTo-Json -Depth 6 -Compress)
if ($boletines.Count -eq 0) { $boletinesJson = "[]" }
if ($boletines.Count -eq 1) { $boletinesJson = "[$boletinesJson]" }

$template = (Get-Content -Path $templatePath -Raw -Encoding UTF8).TrimStart([char]0xFEFF)
$final = $template.Replace('%%ZONAS_JSON%%', $zonasJson).Replace('%%CURSOS_JSON%%', $cursosJson).Replace('%%GRUPOS_JSON%%', $gruposJson).Replace('%%IGLESIAS_JSON%%', $iglesiasJson).Replace('%%OTROS_JSON%%', $otrosJson).Replace('%%IGLESIAS_INSC_JSON%%', $iglesiasInscJson).Replace('%%CORTE_DATOS_JSON%%', $corteJson).Replace('%%CORTE_ANTERIOR_JSON%%', $corteAnteriorJson).Replace('%%BOLETINES_JSON%%', $boletinesJson)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $final, $utf8NoBom)

# Archivo pequeño y aparte (no el index.html completo, que el navegador
# puede tener cacheado) para que el botón "Actualizar" del informe pueda
# preguntar "¿hay un corte más nuevo que el que ya cargué?" sin tener que
# recargar todo. Se consulta por fetch con cache-busting propio.
$ultimoCortePath = Join-Path $dataDir "ultimo_corte.json"
$ultimoCorteJson = [ordered]@{ corte = $corteDatos } | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($ultimoCortePath, $ultimoCorteJson, $utf8NoBom)

Write-Output "OK -> $outPath"
Write-Output "Zonas: $($zonas.Count)  Cursos: $($cursos.Count)  Grupos: $($grupos.Count)  Iglesias sin matricula: $($iglesias.Count)  Otros datos: $($otros.Count)  Iglesias con inscripcion: $($iglesiasInsc.Count)"
Write-Output "Corte de datos: $corteDatos"
Write-Output "Boletines en historial: $($boletines.Count)  (mas reciente: $($novedades.Count) novedad(es))"
