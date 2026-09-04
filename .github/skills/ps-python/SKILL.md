---
name: ps-python
description: Integrate PowerShell 7 (pwsh) with Python via JSON over stdin/stdout or subprocess. Use when the user asks for PowerShell Core + Python. Do not use powershell.exe 5.1. Do not default to pythonnet hosting.
---

# ps-python

Köprü: JSON. `pwsh -NoProfile -NonInteractive`. `python` / `python3`.
Hosting: pythonnet + System.Management.Automation — ağır, varsayılan değil.
https://devblogs.microsoft.com/powershell/hosting-powershell-in-a-python-script/
https://docs.python.org/3/library/subprocess.html

Bu önizlemede koşmaz. C: yok.
