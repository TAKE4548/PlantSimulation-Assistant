import * as child_process from 'child_process';
import * as http from 'http';
import * as vscode from 'vscode';

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
  private polling?: NodeJS.Timeout;

  constructor() {
    let files = vscode.workspace.findFiles("**/*.spp");
    files.then((value) => {
        console.log(value[0]);
        const path = require('path');
        this.modelFile = path.relative(PlantSimLoader.plantsimPath, value[0].fsPath);
        console.log(this.modelFile);
    });
    console.log("hoge");
  }
  /**
   * 全メソッド更新用メソッドをモデル側で実行させるコマンドの本体
   */
  public executeReload() {
    const cmd = PlantSimLoader.plantsimPath;
    if (this.pid === undefined) {  // TODO: 初回以外にもpidが生きてるか確認を入れたい
      // PlantSimをサーバモードで起動
      let proc = child_process.spawn(cmd, ['-WebServer']);
      console.log(proc.pid);
      this.pid = proc.pid;
      // モデルファイルを開く, autoexecは自動で走るはず
      this.pollingRequest('SC_LoadModel:' + this.modelFile);
    } else {
      // モデルが起動済みならautoexecを再実行させる
      this.pollingRequest('SC_CallMethod:.Models.autoexec');
    }
  }

  /**
   * PlantSimのhttpリクエストを成功するまで発行する.
   *
   * @param cmd PlantSimのhttpIF用コマンド文字列
   * @param delay タイムアウトの時間.負数だとタイムアウトを見ない.
   */
  private pollingRequest(cmd: string, delay: number = 10000) {
    let timeout: NodeJS.Timeout;
    if (delay >= 0) {
      timeout = setTimeout(() => {
        // タイムアウトしたらエラーメッセージ出してポーリングを中止する
        vscode.window.showErrorMessage('Request failure.');
        clearTimeout(this.polling);
      }, delay);
    }
    // httpリクエストを試行する
    this.polling = setTimeout(() => {
      console.log(cmd);
      http.get('http://localhost:30001/' + cmd, (res) => {
        console.log(res.statusCode);
        // 成功したらポーリングとタイムアウトの監視を止める
        if (res.statusCode === 200) {
          clearTimeout(this.polling);
          clearTimeout(timeout);
        }
        // 失敗だったらポーリング継続
        else {
          // TODO: 再試行が無駄なレスポンスの場合はエラーメッセージ吐いて終わるようにする
          this.pollingRequest(cmd, -1);
        }
      }).on('error', (e) => {
        // サーバ起動待ちとかそもそも通らないときは試行を繰り返す
        console.log(e);
        this.pollingRequest(cmd, -1);
      });
    }, 1000);
  }
}