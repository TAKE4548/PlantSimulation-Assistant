import * as http from "http";
import { HttpRequestError } from "./exceptions";
import { HTTPCommands } from "./httpCommands";

const RequesterStatus = {  // eslint-disable-line @typescript-eslint/naming-convention
  startup: 'startup',
  idle: 'idle',
  running: 'running',
  error: 'error'
} as const;
export type RequesterStatus = typeof RequesterStatus[keyof typeof RequesterStatus];

/**
 * PlantSimのHttpIFでリクエスト送るクラス
 *
 * @param port PlantSimエンドポイントのPort番号,(default:30001).
 */
export class PlantSimRequester {
  private polling?: NodeJS.Timeout;
  private timeoutObserver?: NodeJS.Timeout;
  private status: RequesterStatus = RequesterStatus.startup;
  constructor(private port: number) { this.status = RequesterStatus.idle; }

  public isIdling(): boolean { return this.status === RequesterStatus.idle; }
  public isErrored(): boolean { return this.status === RequesterStatus.error; }
  public isRunning(): boolean { return this.status === RequesterStatus.running; }

  public async isListening(): Promise<boolean> {
    try { await this.tryRequest(''); }
    catch(e) { return false; }
    return true;
  }
  /**
   * サーバモードで起動中のPlantSimでモデルファイルを開く.
   *
   * @param path 開くモデルファイルのパス
   * @param timeout タイムアウトの時間[ms],(default:10000).
   */
  public async tryLoadModel(path: string, timeout: number = 10000) {
    await this.tryRequest(`${HTTPCommands.loadModel}:${path}`, timeout, 5000);
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
  public async tryRequest(cmd: string, timeout: number = 10000, delay: number = 0) {
    this.status = RequesterStatus.running;
    await Promise.race(
      [this.observeRequest(timeout), this.sendRequest(cmd, delay)]
    ).then(
      () => { this.status = RequesterStatus.idle; }
    ).catch(
      (e) => { this.status = RequesterStatus.error; throw e; }
    );
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
  private sendRequest(cmd: string, delay: number): Promise<void> {
    const promise = new Promise((resolve) => {
      this.polling = setTimeout(() => {
        console.log(cmd);
        http.get(`http://localhost:${this.port}/${cmd}`, {insecureHTTPParser: true}, (res) => {
          resolve(res.statusCode === 200);
        }).on('error', (e) => {
          console.log(e);
          resolve(false);
        });
      }, delay);
    });

    return new Promise((resolve) => {
      promise.then((result) => {
        if (result) { resolve(); }
        else { this.sendRequest(cmd, 5000).then(() => { resolve(); }); };
      });
    });
  }
}
