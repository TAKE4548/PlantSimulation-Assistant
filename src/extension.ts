// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { PlantSimLoader } from "./executeReload";
import { createProject } from "./createProject";
import { updateReloadMethods } from "./updateReloadMethods";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "plantsim-assistant" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
  var build = updateReloadMethods;
  var deploy = async () => {
    var simLoader = await PlantSimLoader.init();
    simLoader.executeReload();
  };
  var buildAndDeploy = async () => build().then(() => deploy());
	context.subscriptions.push(vscode.commands.registerCommand('plantsim-assistant.updateReloadMethod', build));
	context.subscriptions.push(vscode.commands.registerCommand('plantsim-assistant.executeReload', deploy));
	context.subscriptions.push(vscode.commands.registerCommand('plantsim-assistant.updateMethods', buildAndDeploy));
}


// This method is called when your extension is deactivated
export function deactivate() {}
