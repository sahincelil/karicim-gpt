# pwsh 7 + .NET. powershell.exe 5.1 degil.
$ErrorActionPreference = "Stop"
Write-Host ("ps {0}  clr {1}" -f $PSVersionTable.PSVersion, [System.Runtime.InteropServices.RuntimeInformation]::FrameworkDescription)
Write-Host [datetime]::UtcNow
using namespace System.Collections.Generic
$list = [List[string]]::new()
$list.Add('ok')
Add-Type -TypeDefinition @'
public static class K {
  public static int Add(int a, int b) => a + b;
}
'@
Write-Host ([K]::Add(2, 3))
