import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { autoExec, createTree, exportMethods } from './data/createTree';

/**
 * 指定のソースファイルを作成する
 * @param filePath 作成するソースファイルのパス
 * @param code 作成するソースコードの本文
 */
function createFile(filePath: string, code: string) {
  try { fs.writeFileSync(filePath, code); }
  catch (err) { console.log(err); }
}

/**
 * PlantSim拡張用プロジェクトの雛形を作成するコマンド
 */
export function createProject() {
  let rootPath: string | undefined = vscode.workspace.getConfiguration('psimAssistant').get('prjDir');
  if (rootPath === undefined) {throw new Error("project directory path is undefined."); }
  if (rootPath.match('\~.*')) {
    const home = process.env.HOMEPATH;
    if (home === undefined) { throw new Error("home directory is not defined."); }
    rootPath = rootPath.replace('~', home);
  }
  const srcPath = path.join(rootPath, 'src');
  console.log(srcPath);
  try { fs.mkdirSync(srcPath, {recursive: true}); }
  catch (err) { console.log(err); }

  // 書き出し用PSスクリプトファイル作成
  const filePath = path.join(rootPath, 'create_tree.simtalk');
  createFile(filePath, createTree);

  // 特殊メソッドファイル作成
  const simFunctions = [autoExec, exportMethods];
  simFunctions.forEach((method) => {
    // メソッド名のディレクトリを立てる
    const methodName = method.toString().match(/\[.* (.*)\]/)![1];
    const dirPath = path.join(rootPath!, methodName);
    try { fs.mkdirSync(dirPath, {recursive: true}); }
    catch (err) { console.log(err); }
    // メソッド本体と内包するユーザ定義メソッドのファイルを作る
    for (const [key, value] of Object.entries(method)) {
      const filePath = path.join(dirPath, (key === 'main' ? methodName : key) + '.simtalk');
      createFile(filePath, value);
    }
  });
}
