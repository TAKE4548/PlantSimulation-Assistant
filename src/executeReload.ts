import * as child_process from 'child_process';
import * as http from 'http';

/**
 * PlantSimのプロセスに対してメソッドのリロードを制御するクラス
 *
 * @field pid 起動中のPlantSimプロセスID
 */
export class PlantSimLoader {
  private pid: number | undefined = undefined;

  /**
   * 全メソッド更新用メソッドをモデル側で実行させるコマンドの本体
   */
  public executeReload() {
    const PLANTSIM_PATH = 'C:\\Program Files\\Siemens\\Tecnomatix Plant Simulation 2201\\PlantSimulation.exe';
    const MODEL_PATH = 'hoge.spp'; // PLANTSIM_PATHのディレクトリからの相対パスである必要があるらしい
    const cmd = PLANTSIM_PATH;
    if (this.pid === undefined) {  // TODO: 初回以外にもpidが生きてるか確認を入れたい
      // PlantSimをサーバモードで起動
      // let proc = child_process.spawn(cmd, ['-WebServer']);
      let proc = child_process.spawn(cmd);
      console.log(proc.pid);
      this.pid = proc.pid;
      // モデルファイルを開く, autoexecは自動で走るはず
      http.get('http://localhost:30001/SC_LoadModel:' + MODEL_PATH, (res) => {console.log(res.statusCode);});
    } else {
      // モデルが起動済みならautoexecを再実行させる
      http.get('http://localhost:30001/SC_CallMethod:.Models.autoexec', (res) => {console.log(res.statusCode);});
    }
  }
}