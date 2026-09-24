$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$htmlPath = Join-Path (Get-Location) 'index.html'
$uri = ([System.Uri]$htmlPath).AbsoluteUri
Write-Output "URI=$uri"

$tmp = Join-Path $env:TEMP 'opencode'
if (-not (Test-Path $tmp)) { New-Item -ItemType Directory -Path $tmp -Force | Out-Null }
$profile = Join-Path $tmp 'chrome_smoke_profile'
$outFile = Join-Path $tmp 'chrome_dom.html'
$log = Join-Path $tmp 'chrome_smoke.log'
Remove-Item $outFile,$log -ErrorAction SilentlyContinue
if (Test-Path $profile) { Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue }
New-Item -ItemType Directory -Path $profile -Force | Out-Null

# Start-Process avoids PS pipeline mangling of chrome stdout
$argList = @(
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  '--no-first-run',
  '--no-default-browser-check',
  "--user-data-dir=`"$profile`"",
  '--enable-logging=stderr',
  '--v=0',
  '--virtual-time-budget=12000',
  '--dump-dom',
  "`"$uri`""
)
$p = Start-Process -FilePath $chrome -ArgumentList $argList -Wait -PassThru -NoNewWindow `
  -RedirectStandardOutput $outFile -RedirectStandardError $log
Write-Output "exitCode=$($p.ExitCode)"

$dom = ''
if (Test-Path $outFile) { $dom = [IO.File]::ReadAllText($outFile, [Text.Encoding]::UTF8) }
Write-Output "domBytes=$($dom.Length)"
$hasRoot = $dom.Contains('id="root"') -or $dom.Contains("id='root'")
$hasApp = $dom.Contains('class="app"') -or $dom.Contains("class='app'")
$chainPat = 'for(let hop=0;hop<5'
$hasChain = $dom.Contains($chainPat)
Write-Output "hasRoot=$hasRoot"
Write-Output "hasApp=$hasApp"
Write-Output "hasChain=$hasChain"

$bad = @()
if (Test-Path $log) {
  $lines = Get-Content $log -ErrorAction SilentlyContinue
  Write-Output "logLines=$($lines.Count)"
  $bad = @($lines | Where-Object { $_ -match 'ERROR:|Uncaught|SyntaxError|ReferenceError|TypeError|Failed to load resource|CONSOLE\(' })
  Write-Output "badLines=$($bad.Count)"
  $bad | Select-Object -First 25 | ForEach-Object { Write-Output "  $_" }
}

if ($dom.Length -gt 1000 -and $hasRoot) {
  Write-Output 'SMOKE: PASS'
  $code = 0
} else {
  # show first 500 chars of dom for debug
  Write-Output ('domHead=' + $dom.Substring(0, [Math]::Min(500, $dom.Length)))
  Write-Output 'SMOKE: FAIL'
  $code = 1
}

Remove-Item $profile -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $outFile,$log -Force -ErrorAction SilentlyContinue
exit $code
