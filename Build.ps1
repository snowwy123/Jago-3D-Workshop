$ErrorActionPreference='Stop'
& node (Join-Path $PSScriptRoot 'build.mjs')
if($LASTEXITCODE -ne 0){throw 'Browser build failed'}
$sdk=Join-Path $PSScriptRoot 'Dependencies\WebView2'
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $compiler /nologo /target:winexe /platform:x64 /optimize+ /utf8output ('/out:'+(Join-Path $PSScriptRoot 'Jago-3D-Workshop.exe')) ('/win32manifest:'+(Join-Path $PSScriptRoot 'Source\app.manifest')) ('/win32icon:'+(Join-Path $PSScriptRoot 'Workshop.ico')) /reference:System.dll /reference:System.Core.dll /reference:System.Drawing.dll /reference:System.Windows.Forms.dll ('/reference:'+(Join-Path $sdk 'lib\net462\Microsoft.Web.WebView2.Core.dll')) ('/reference:'+(Join-Path $sdk 'lib\net462\Microsoft.Web.WebView2.WinForms.dll')) (Join-Path $PSScriptRoot 'Source\Host.cs')
if($LASTEXITCODE -ne 0){throw 'Windows build failed'}
Copy-Item -LiteralPath (Join-Path $sdk 'lib\net462\Microsoft.Web.WebView2.Core.dll'),(Join-Path $sdk 'lib\net462\Microsoft.Web.WebView2.WinForms.dll'),(Join-Path $sdk 'runtimes\win-x64\native\WebView2Loader.dll') -Destination $PSScriptRoot -Force
