# pwsh -> python JSON
$ErrorActionPreference = "Stop"
$py = (Get-Command python, python3 -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $py) { throw "python yok" }
$in = @{ host = $env:COMPUTERNAME; at = (Get-Date).ToString("o") } | ConvertTo-Json -Compress
& $py -c "import json,sys; d=json.loads(sys.argv[1]); print(json.dumps({'ok': True, 'host': d.get('host')}))" $in
