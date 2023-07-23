import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * 全メソッド更新用のメソッドのソースファイルを生成するコマンドの本体
 *
 */
export async function updateReloadMethods() {
  let files = vscode.workspace.findFiles("src/**/*.simtalk");
  const UPDATE_FILE = "reload_methods.simtalk";
  // .simtalkファイルをload関数に反映させる
  let writeText: string = "";
  await files.then((value) => {
    for (let val of value) {
      const RELATIVE_PATH = vscode.workspace.asRelativePath(val.path);
      const SPLITTED_PATH = RELATIVE_PATH.split('/');
      if (SPLITTED_PATH[0] !== 'src') {
        throw new URIError('Projectにsrcディレクトリがありません`Create Projectを実行して作成してください');
      }
      const FILE_NAME = SPLITTED_PATH.at(-1)?.split('.').at(0);
      // 更新かけなくていい特殊なメソッドはここで省く
      switch (FILE_NAME?.toLowerCase()) {
        case UPDATE_FILE.split('.').at(0)?.toLowerCase():  // reloadメソッドそのもの
        case 'autoexec':  // 起動時自動実行メソッド
          continue;
        default:
          break;
      }
      if (FILE_NAME === UPDATE_FILE.split('.').at(0)) { continue; }
      // ファイルの階層に基づいて、loadを実行するメソッドまでのパスを形成
      const TAIL_DIR_NAME = SPLITTED_PATH.at(-2);
      if (TAIL_DIR_NAME === undefined) {
        throw new Error('不正なパス');
      }
      if (TAIL_DIR_NAME === FILE_NAME) {
        writeText += '.' + SPLITTED_PATH.slice(1, -2).join('.') + '.&';
      } else if (isMethodInMethod(val)) {
        writeText += '.' + SPLITTED_PATH.slice(1, -2).join('.') + '.';
        writeText += '&' + SPLITTED_PATH.at(-2) + '.';
      } else {
        writeText += '.' + SPLITTED_PATH.slice(1, -1).join('.') + '.&';
      }
      writeText += FILE_NAME + '.load(\"' + val.fsPath + '\")\n';
      console.log(writeText);
    }
    // ワークスペースからのフルパスが必要なので、書き込むファイルまで連結する
    const WORK_SPACES = vscode.workspace.workspaceFolders;
    if (typeof WORK_SPACES === 'undefined') {
      throw new URIError('ワークスペースフォルダが開かれていません');
    }
    let writePath = WORK_SPACES[0].uri;
    writePath = vscode.Uri.joinPath(writePath, UPDATE_FILE);
    // load関数のsimtalk文をファイルに書き込む
    vscode.workspace.fs.writeFile(writePath, new TextEncoder().encode(writeText));
  });
  vscode.window.showInformationMessage("更新完了");
};

/**
 * ファイルURIを見て、メソッド内のユーザ定義メソッドであるかを判別する
 *
 * @param uri 判別したいファイルのURI
 * @returns 判別結果.true:メソッド内メソッド/false:メソッド内メソッドではない
 */
function isMethodInMethod(uri: vscode.Uri): boolean {
  var parentPath = vscode.Uri.joinPath(uri, "..").path;
  var pathElems = parentPath.split('/');
  var tailDir = pathElems.at(-1);
  if (tailDir === undefined) {throw new Error("不正なパス");}
  pathElems.push(tailDir);
  return fs.existsSync(pathElems.slice(1).join('/') + '.simtalk');
}