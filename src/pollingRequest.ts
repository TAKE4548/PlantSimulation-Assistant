import * as http from "http";
import { HttpRequestError } from "./exceptions";
import { HTTPCommands } from "./httpCommands";


/**
 * PlantSimのHttpIFでリクエスト送るクラス
 *
 * @param port PlantSimエンドポイントのPort番号,(default:30001).
 */
export class PlantSimRequester {
  private polling: NodeJS.Timeout | undefined;
  private timeoutObserver: NodeJS.Timeout | undefined;
  constructor(private port: number = 30001) {}

  /**
   * サーバモードで起動中のPlantSimでモデルファイルを開く.
   *
   * @param path 開くモデルファイルのパス
   * @param timeout タイムアウトの時間[ms],(default:10000).
   */
  public async tryLoadModel(path: string, timeout: number = 10000) {
    await this.tryRequest(`${HTTPCommands.loadModel}:${path}`, timeout);
    // console.log(`${HTTPCommands.loadModel}:${path}`);
  }

  /**
   * サーバモードで起動中のPlantSimでメソッドを実行する.
   *
   * @param method 実行するメソッドのパス(モデル内パス).
   * @param timeout タイムアウトの時間[ms],(default:10000).
   */
  public async tryCallMethod(method: string, timeout: number = 10000) {
    await this.tryRequest(`${HTTPCommands.callMethod}:${method}`, timeout);
  }

  /**
   * PlantSimのhttpリクエストを成功するまで発行する.
   *
   * @param cmd PlantSimのhttpIF用コマンド文字列.
   * @param timeout タイムアウトの時間[ms],(default:10000).
   */
  public async tryRequest(cmd: string, timeout: number = 10000) {
    await Promise.race([this.observeRequest(timeout), this.sendRequest(cmd, 5000)]).catch((e) => {throw e;});
  }

  /**
   * 試行中リクエストのタイムアウトを監視する.
   *
   * @param timeout タイムアウトの時間[ms].
   */
  private observeRequest(timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.timeoutObserver !== undefined) { clearTimeout(this.timeoutObserver); }
      this.timeoutObserver = setTimeout(() => {
        // タイムアウトしたらポーリングを中止する
        clearTimeout(this.polling);
        reject(new HttpRequestError("Request Timeout"));
        resolve();
      }, timeout);
    });
  }

  /**
   * httpリクエストを発行する.
   *
   * @param cmd PlantSimのhttpIF用コマンド文字列.
   * @param delay リクエストの試行間隔[ms].
   */
  private sendRequest(cmd: string, delay: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.polling = setTimeout(() => {
        let succeeded: boolean = false;
        console.log(cmd);
        http.get(`http://localhost:${this.port}/${cmd}`, (res) => {
          if (res.statusCode === 200) { succeeded = true; }
        }).on('error', (e) => { console.log(e); });
        // 成功するまで再度試行する
        if (succeeded) { resolve(succeeded); }
        else { this.sendRequest(cmd, delay); }
      }, delay);
    });
  }
}
