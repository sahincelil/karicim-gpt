import json, shutil, subprocess, sys

pwsh = shutil.which("pwsh")
if not pwsh:
    sys.exit("pwsh yok")

r = subprocess.run(
    [
        pwsh,
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "@{ os = $PSVersionTable.PSVersion.ToString() } | ConvertTo-Json -Compress",
    ],
    check=True,
    capture_output=True,
    text=True,
)
print(json.loads(r.stdout))
