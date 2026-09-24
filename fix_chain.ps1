$ErrorActionPreference = 'Stop'
$path = Join-Path $PSScriptRoot 'Ular-Tangga-Publish-Ready-V4-6Pemain.html'
$bytes = [IO.File]::ReadAllBytes($path)
$bom = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
$v = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)

$start = 'await i(350);let d=S,_A="";'
$end = 'if(await i(400),mg[d])'
$i = $v.IndexOf($start, [StringComparison]::Ordinal)
$j = $v.IndexOf($end, [StringComparison]::Ordinal)
if ($i -lt 0 -or $j -lt 0 -or $j -le $i) {
    Write-Output "FAIL locate i=$i j=$j"
    exit 1
}

$arrow = [string][char]0x2192
$uSnake = '\uD83D\uDE22'
$uLad = '\uD83C\uDF89'

$new = 'await i(350);let d=S,_A="";' +
    'for(let hop=0;hop<5;hop++){let R=0,kind="";' +
    'if(hg[d]){R=hg[d];kind="s"}else if(bg[d]){R=bg[d];kind="l"}else if(q3[d]){R=q3[d];kind="b"}else break;' +
    'if(kind==="s"){(window.UlarAudio&&window.UlarAudio.playSnake());' +
    '_A+=` Aduh! Ular! Turun dari ${d} ke ${R} ' + $uSnake + '`;' +
    'I(`${A[v].name} kena Ular! ${d} ' + $arrow + ' ${R}`);await i(600)}' +
    'else if(kind==="l"){(window.UlarAudio&&window.UlarAudio.playLadder());' +
    '_A+=` Alhamdulillah! Tangga! Naik dari ${d} ke ${R} ' + $uLad + '`;' +
    'I(`${A[v].name} dapat Tangga! ${d} ' + $arrow + ' ${R}`);await i(600)}' +
    'else{if(R>d)I(`Bonus! Maju dari ${d} ke ${R}`);else I(`Mundur dari ${d} ke ${R}`);await i(500)}' +
    'd=R;f((JA)=>{let zA=[...JA];return zA[v]={...zA[v],pos:R},zA})}'

$out = $v.Substring(0, $i) + $new + $v.Substring($j)
$enc = New-Object Text.UTF8Encoding($bom)
[IO.File]::WriteAllText($path, $out, $enc)

$check = [IO.File]::ReadAllText($path, [Text.Encoding]::UTF8)
Write-Output ("loop present: " + $check.Contains('for(let hop=0;hop<5;hop++)'))
Write-Output ("old chain gone: " + (-not $check.Contains('else if(q3[d]){let R=q3[d];')))
Write-Output ("snake escape: " + $check.Contains('uD83D\uDE22'))
Write-Output ("ladder escape: " + $check.Contains('uD83C\uDF89'))
Write-Output ("bg 79:82: " + $check.Contains('79:82'))
Write-Output ("BOM: $bom")
