$v4 = Get-Content "C:\Users\Bank Yan\ular tangg v4\Ular-Tangga-Publish-Ready-V4-6Pemain.html" -Raw -Encoding UTF8
$idx = Get-Content "C:\Users\Bank Yan\ular tangg v4\index.html" -Raw -Encoding UTF8

$patOldDef = 'window.UlarSpeech=(function'
$patStub = 'window.UlarSpeech={speak:function(){}'
$patMaxH = 'maxHeight:"85vh"'
$patDiceGuard = 'if(z||n||F!==null||D!==null)return;'
$mojiPat = [regex](([char]0xE2).ToString() + ([char]0x20AC) + '|' + ([char]0xE2).ToString() + ([char]0x153) + '|' + ([char]0xEF).ToString() + ([char]0xBC))
$goodPat = [regex]('[' + ([char]0x2022) + ']')

Write-Output "=== V4-6Pemain ==="
$c1 = $v4.Contains('TANTANGAN ISLAMI')
$c2 = $v4.Contains('position:"fixed"')
$c3 = $v4.Contains('Lanjutkan Permainan')
$c4 = (-not $v4.Contains('bottom:"8px"'))
$c5 = $v4.Contains('orientation:landscape')
$c6 = $v4.Contains('safe-area-inset-top')
$c7 = $v4.Contains('100dvh')
$c8 = $v4.Contains('speechSynthesis')
$c9 = $v4.Contains($patOldDef)
$c10 = $v4.Contains('zIndex:999')
$c11 = $v4.Contains($patMaxH)
Write-Output "1. TANTANGAN ISLAMI modal: $c1"
Write-Output "2. position fixed overlay: $c2"
Write-Output "3. Lanjutkan Permainan: $c3"
Write-Output "4. toast bottom lama hilang: $c4"
Write-Output "5. landscape media query: $c5"
Write-Output "6. safe-area-inset-top: $c6"
Write-Output "7. 100dvh: $c7"
Write-Output "8. TTS speechSynthesis aktif: $c8"
Write-Output "9. UlarSpeech IIFE: $c9"
Write-Output "10. zIndex 999: $c10"
Write-Output "11. maxHeight 85vh: $c11"

Write-Output ""
Write-Output "=== index.html ==="
$d1 = (-not $idx.Contains($patStub))
$d2 = $idx.Contains($patOldDef)
$d3 = $idx.Contains('speechSynthesis')
$d4 = $idx.Contains('gender:"male"')
$d5 = $idx.Contains('UlarSpeech.speak(_t,A[v].gender)')
$d6 = $idx.Contains('Butuh folder sounds/')
$d7 = (-not $idx.Contains('No external deps'))
Write-Output "1. stub no-op tidak dipakai (pakai IIFE): $d1"
Write-Output "2. UlarSpeech IIFE: $d2"
Write-Output "3. speechSynthesis aktif: $d3"
Write-Output "4. gender pemain: $d4"
Write-Output "5. call site speak+gender: $d5"
Write-Output "6. footer jujur (sounds): $d6"
Write-Output "7. klaim No external deps hilang: $d7"

Write-Output ""
Write-Output "=== kualitas ==="
$e1 = ($mojiPat.Matches($v4).Count -eq 0) -and ($mojiPat.Matches($idx).Count -eq 0)
$e2 = ($goodPat.Matches($v4).Count -gt 0) -and ($goodPat.Matches($idx).Count -gt 0)
$e3 = $v4.Contains($patDiceGuard)
$e4 = (-not $v4.Contains($patStub))
$h4 = (Get-FileHash "C:\Users\Bank Yan\ular tangg v4\Ular-Tangga-Publish-Ready-V4-6Pemain.html" -Algorithm SHA256).Hash
$h5 = (Get-FileHash "C:\Users\Bank Yan\ular tangg v4\index.html" -Algorithm SHA256).Hash
$e5 = ($h4 -eq $h5)
$e6 = $v4.Contains('for(let hop=0;hop<5;hop++)') -and $idx.Contains('for(let hop=0;hop<5;hop++)')
$e7 = $v4.Contains('79:82') -and $idx.Contains('79:82')
$e8 = (-not $v4.Contains('else if(q3[d]){let R=q3[d];')) -and (-not $idx.Contains('else if(q3[d]){let R=q3[d];'))
$e9 = $v4.Contains('function cleanForSpeech') -and $idx.Contains('function cleanForSpeech')
$e10 = $v4.Contains('u.pitch=isBoy?1.0:1.12') -and $idx.Contains('u.pitch=isBoy?1.0:1.12')
$e11 = (-not $v4.Contains('u.pitch=isBoy?1.35:1.7')) -and (-not $idx.Contains('u.pitch=isBoy?1.35:1.7'))
$e12 = $v4.Contains('google.*bahasa indonesia') -and $idx.Contains('google.*bahasa indonesia')
$e13 = $v4.Contains('u.lang="id-ID"') -and $idx.Contains('u.lang="id-ID"')
Write-Output "1. mojibake nol di kedua file: $e1"
Write-Output "2. karakter bullet asli ada: $e2"
Write-Output "3. dice guard blokir modal D: $e3"
Write-Output "4. tanpa stub mati: $e4"
Write-Output "5. kedua file identik: $e5"
Write-Output "6. chain loop multi-hop: $e6"
Write-Output "7. bg 79:82 mid-ladder: $e7"
Write-Output "8. chain lama (if tunggal) hilang: $e8"
Write-Output "9. cleanForSpeech teks Indonesia: $e9"
Write-Output "10. pitch natural (bukan chipmunk): $e10"
Write-Output "11. pitch lama 1.35/1.7 hilang: $e11"
Write-Output "12. voice Indonesia prioritas: $e12"
Write-Output "13. lang id-ID selalu: $e13"

$all = @($c1,$c2,$c3,$c4,$c5,$c6,$c7,$c8,$c9,$c10,$c11,$d1,$d2,$d3,$d4,$d5,$d6,$d7,$e1,$e2,$e3,$e4,$e5,$e6,$e7,$e8,$e9,$e10,$e11,$e12,$e13)
$failed = @($all | Where-Object { $_ -ne $true })
Write-Output ""
if ($failed.Count -eq 0) {
  Write-Output "RESULT: PASS ($($all.Count)/$($all.Count))"
  exit 0
} else {
  Write-Output "RESULT: FAIL ($($failed.Count) gagal dari $($all.Count))"
  exit 1
}
