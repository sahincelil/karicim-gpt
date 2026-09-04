---
name: ps-dotnet
description: PowerShell 7 (.NET) interop — Add-Type, New-Object, [Type]::new(), using namespace, inline C#. Use when the user asks for PowerShell and .NET. pwsh 7 is .NET; powershell.exe 5.1 is .NET Framework. Preview cannot run pwsh.
---

# ps-dotnet

- Tip: `[datetime]::UtcNow`, `[guid]::NewGuid()`, `[Type]::new()`
- `New-Object -TypeName`
- `using namespace System.Collections.Generic`
- `Add-Type -AssemblyName` / `-Path` / `-TypeDefinition`

https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/add-type?view=powershell-7.6
https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_object_creation?view=powershell-7.6
