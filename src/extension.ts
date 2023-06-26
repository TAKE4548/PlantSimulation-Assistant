// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "plantsim-assistant" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('plantsim-assistant.updateReloadMethod', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
    let files = vscode.workspace.findFiles("**/*.simtalk");
    const UPDATE_FILE = "reload_methods.simtalk";
    // .simtalkファイルをload関数に反映させる
    let writeText: string = "";
    files.then((value) => {
      for (let val of value) {
        const RELATIVE_PATH = vscode.workspace.asRelativePath(val.path);
        const SPLITTED_PATH = RELATIVE_PATH.split('/');
        const FILE_NAME = SPLITTED_PATH.at(-1)?.split('.').at(0);
        // 更新用ファイルが残ってたら一緒に引っかかるので、ここで省く
        if (FILE_NAME === UPDATE_FILE.split('.').at(0)) {
          continue;
        }
        // ファイルの階層に基づいて、loadを実行するメソッドまでのパスを形成
        writeText += '.' + SPLITTED_PATH.slice(0, -1).join('.');
        writeText += '&' + FILE_NAME + '.load(\"' + val.fsPath + '\")\n';
        console.log(writeText);
      }
      // ワークスペースからのフルパスが必要なので、書き込むファイルまで連結する
      const WORK_SPACES = vscode.workspace.workspaceFolders;
      if (typeof WORK_SPACES === 'undefined') {
        throw new Error("hoge");
      }
      let writePath = WORK_SPACES[0].uri;
      writePath = vscode.Uri.joinPath(writePath, UPDATE_FILE);
      // load関数のsimtalk文をファイルに書き込む
      vscode.workspace.fs.writeFile(writePath, new TextEncoder().encode(writeText));
    });
    vscode.window.showInformationMessage("更新完了");
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
