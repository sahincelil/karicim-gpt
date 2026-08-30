# karicim-kopru.ps1
# Onizleme C: gormeZ. Bu dosya SENIN Windows oturumunda calisir.
# Gizli gorev yok. AV kapatmaz. Admin istemez.
# Cikti: %USERPROFILE%\Karicim\nabiz.md

$ErrorActionPreference = "Stop"
$outDir = Join-Path $env:USERPROFILE "Karicim"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$c = Get-PSDrive -Name C -PSProvider FileSystem -ErrorAction SilentlyContinue
$lines = @()
$lines += "# Karicim kopru"
$lines += ""
$lines += ("saat: {0}" -f (Get-Date).ToString("o"))
$lines += ("host: {0}" -f $env:COMPUTERNAME)
$lines += ("user: {0}" -f $env:USERNAME)
$lines += ("home: {0}" -f $env:USERPROFILE)

if ($c) {
  $freeGb = [math]::Round($c.Free / 1GB, 2)
  $usedGb = [math]::Round(($c.Used) / 1GB, 2)
  $lines += ("C: var  used={0}GB  free={1}GB  root={2}" -f $usedGb, $freeGb, $c.Root)
} else {
  $lines += "C: yok (bu oturumda FileSystem C bulunamadi)"
}

$lines += ""
$lines += "yazilan: $outDir\nabiz.md"
$lines += "onizleme bu dosyayi gormeZ; GitHub'a basarsan kalir."

$body = $lines -join "`n"
$path = Join-Path $outDir "nabiz.md"
Set-Content -Path $path -Value $body -Encoding utf8
Write-Host $body
Write-Host ""
Write-Host "Tamam. Dosya: $path"
