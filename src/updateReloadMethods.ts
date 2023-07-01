import * as vscode from 'vscode';

export function updateReloadMethods() {
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
};