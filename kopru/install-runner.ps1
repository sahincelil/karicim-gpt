# install-runner.ps1
# Sen çalıştırırsın. Token'i GitHub UI'dan yapıştır.
# Public repoda self-hosted TAKMA — PR ile PC'ne iş gelir.
# Servis yok (gizli kalmaz). .credentials commit etme.
#
# Kullanım:
#   .\install-runner.ps1 -Token AAAAA
# Token: https://github.com/sahincelil/karicim-gpt/settings/actions/runners/new

param(
  [Parameter(Mandatory = $true)][string]$Token,
  [string]$Url = "https://github.com/sahincelil/karicim-gpt",
  [string]$Name = $env:COMPUTERNAME,
  [string]$Dir = "C:\actions-runner"
)

$ErrorActionPreference = "Stop"
$ver = "2.337.0"
$zip = "actions-runner-win-x64-$ver.zip"
$uri = "https://github.com/actions/runner/releases/download/v$ver/$zip"
$sha = "1150692afa94e71f872017e254ea55b6eece1eece3fe7e3a6d4c93d0a1b85cfc"

Write-Host "DUR: repo public ise bu scripti çalıştırma."
Write-Host "Settings → General → Change repository visibility → Private, sonra token al."

if (Test-Path (Join-Path $Dir ".runner")) {
  throw "Zaten kurulu: $Dir"
}

New-Item -ItemType Directory -Force -Path $Dir | Out-Null
Set-Location $Dir

Write-Host "indir $uri"
Invoke-WebRequest -Uri $uri -OutFile $zip
$hash = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
if ($hash -ne $sha) { throw "SHA256 uymadi $hash" }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$Dir\$zip", $Dir)
Remove-Item $zip

& .\config.cmd --url $Url --token $Token --name $Name --labels windows,karicim --unattended --replace
if ($LASTEXITCODE -ne 0) { throw "config.cmd $LASTEXITCODE" }

Write-Host ""
Write-Host "Kurulum bitti. Servis YOK."
Write-Host "Calistir:  $Dir\run.cmd"
Write-Host "Durdur:    Ctrl+C"
Write-Host "Kaldir:    $Dir\config.cmd remove --token <yeni-token>"
