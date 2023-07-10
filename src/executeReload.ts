import * as child_process from 'child_process';
import * as vscode from 'vscode';
import { HttpRequestError } from './exceptions';
import { PlantSimRequester } from './pollingRequest';

/**
 * PlantSimのプロセスに対してメソッドのリロードを制御するクラス.
 *
 * @static plantsimPath PlantSimの実行ファイルへのパス.
 * @property pid 起動中のPlantSimプロセスID.
 */
export class PlantSimLoader {
  static readonly plantsimPath: string = 'C:\\Program Files\\Siemens\\Tecnomatix Plant Simulation 2201\\PlantSimulation.exe';
  private pid?: number;
  private modelFile: string = '';

  constructor() {
    let files = vscode.workspace.findFiles("**/*.spp");
    files.then((value) => {
        this.modelFile = value[0].fsPath;
        console.log(this.modelFile);
    });
    console.log("hoge");
  }

  /**
   * 全メソッド更新用メソッドをモデル側で実行させるコマンドの本体
   */
  public async executeReload() {
    const requester = new PlantSimRequester();

    if (this.pid === undefined) {  // TODO: 初回以外にもpidが生きてるか確認を入れたい
      // PlantSimをサーバモードで起動
      let proc = child_process.spawn(PlantSimLoader.plantsimPath, ['-WebServer']);
      console.log(proc.pid);
      this.pid = proc.pid;
      // モデルファイルを開く, autoexecは自動で走るはず
      try { await requester.tryLoadModel(this.modelFile, 30000); }
      catch(e) { this.assortHttpException(e, "Model open failed."); }
    } else {
      // モデルが起動済みならautoexecを再実行させる
      try { await requester.tryCallMethod('.Models.autoexec', 30000); }
      catch(e) { this.assortHttpException(e, "Method execute failed."); }
    }
    if (!requester.isErrored()) { vscode.window.showInformationMessage('Reload complete.'); }
  }

  /**
   * 指定された例外が予期したものであれば、vscodeにメッセージを出し、それ以外はスローする.
   *
   * @param err 仕分ける例外インスタンス.
   * @param msg vscodeのエラーメッセージで表示する文字列.
   */
  private assortHttpException(err: unknown, msg: string) {
    if(err instanceof HttpRequestError) { vscode.window.showErrorMessage(msg); }
    else { throw err; }
  }
}