/**
 * PlantSim拡張機能の基底例外
 */
class SimtalkError extends Error {
  constructor(public message: string) {
    super(message);
    this.name = "SimtalkError";
  }
}

/**
 * PlantSimのhttpIF向けの例外
 */
export class HttpRequestError extends SimtalkError {
  constructor(public message: string, status?: number) {
    super(message);
    this.name = "HttpRequestError";
    this.message = `${status}: ${message}`;
  }
}