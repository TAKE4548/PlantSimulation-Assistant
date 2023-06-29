param(
    [parameter(Mandatory)][string]$MethodPath,
    [parameter(Mandatory)][string]$MethodCode
)

$method_elems = ("tmp." + $MethodPath).Split(".")
$dir = [string]::Join("/", $method_elems[0..($method_elems.Length-2)])
$file = $method_elems[-1] + ".simtalk"
New-Item -Path $dir -ItemType Directory -Force
$org_dir = Get-Location
Set-Location $dir
Write-Output $MethodCode > $file
Set-Location $org_dir
