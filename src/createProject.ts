import * as vscode from 'vscode';
import * as fs from 'fs';

export function createProject() {
  const folders = vscode.workspace.workspaceFolders;
  if (folders === undefined) {
    vscode.window.showErrorMessage("Error: Projectを作成するワークスペースフォルダを開いてください");
    return;
  }
  const rootPath = folders[0].uri;
  vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(rootPath, "src"));
  const buf = Buffer.from(
    `param(
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
    Set-Location $org_dir`
  );
  vscode.workspace.fs.writeFile(vscode.Uri.joinPath(rootPath, "create_tree.ps1"), buf);
}