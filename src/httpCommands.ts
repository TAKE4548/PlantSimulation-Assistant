export const HTTPCommands = {  // eslint-disable-line @typescript-eslint/naming-convention
  callMethod: 'SC_CallMethod',
  image: 'SC_Image',
  loadModel: 'SC_LoadModel',
  loadObject: 'SC_LoadObject',
  openDialog: 'SC_OpenDialog'
} as const;

/**
 * HTTPリクエストで扱えるコマンドの定義
 */
export type HTTPCommands = typeof HTTPCommands[keyof typeof HTTPCommands];
