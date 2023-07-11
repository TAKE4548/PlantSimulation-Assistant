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
  private static instance?: PlantSimLoader;
  private cProc?: child_process.ChildProcess;
  private constructor(
    private plantsimPath: string,
    private port: number,
    private modelFile: string
  ) {}

  public static init = async () => {
    if (PlantSimLoader.instance !== undefined) { return PlantSimLoader.instance; }
    const configs = vscode.workspace.getConfiguration("psimAssistant");
    // 実行ファイルパスの取得
    const psimPath: string | undefined = configs.get("psimPath");
    if (psimPath === undefined) { throw new Error(`configuration 'psimPath' is not defined.`); }
    // サーバモードのポート設定
    const port: number = configs.get("port") ?? 30001;
    // 対象モデルファイルの取得
    var modelFile: string | undefined = configs.get("modelPath");
    if (modelFile === undefined) { throw new Error(`configuration 'modelFile' is not defined.`); }
    if (modelFile === '') { modelFile = await this.findModelFile(); }
    PlantSimLoader.instance = new this(psimPath, port, modelFile);
    return PlantSimLoader.instance;
  };

  private static async findModelFile(): Promise<string> {
    return vscode.window.showQuickPick(
      vscode.workspace.findFiles("**/*.spp").then((files) => files.map((x => x.fsPath))),
      { placeHolder: 'リンクするモデルファイルを選んでください' }
    ).then((file) => {
      if (file === undefined) { throw new Error("*.spp file is not found."); }
      return file;
    });
  }

  /**
   * 全メソッド更新用メソッドをモデル側で実行させるコマンドの本体
   */
  public async executeReload() {
    const requester = new PlantSimRequester(this.port);

    if (this.cProc === undefined) {  // TODO: 初回以外にもpidが生きてるか確認を入れたい
      // PlantSimをサーバモードで起動
      this.cProc = child_process.spawn(this.plantsimPath, ['-WebServer']);
      this.cProc.on("exit", () => this.cProc = undefined);
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