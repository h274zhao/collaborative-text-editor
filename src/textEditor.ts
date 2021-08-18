import type { editor, IDisposable, IPosition, } from "monaco-editor/esm/vs/editor/editor.api";
import { OpSeq } from "rust-wasm";

export type Options = {
  readonly uri: string;
  readonly editor: editor.IStandaloneCodeEditor;
  readonly onConnected?: () => unknown;
  readonly onDisconnected?: () => unknown;
  readonly onDesynchronized?: () => unknown;
  readonly onChangeLanguage?: (language: string) => unknown;
  readonly onChangeUsers?: (users: Record<number, UserInfo>) => unknown;
  readonly reconnectInterval?: number;
};

export type UserInfo = {
  readonly name: string;
};
class TextEditor {
  public ws?: WebSocket;
  public recentFailures: number = 0;
  public connecting?: boolean;
  public readonly model: editor.ITextModel;
  public readonly onChangeHandle: IDisposable;
 // public readonly tryConnectId: number;
  public readonly resetFailuresId: number;


  public currentValue: string = "";
  public ignoreChanges: boolean = false;

  public me: number = -1;
  public revision: number = 0;
  public buffer?: OpSeq;
  public myInfo?: UserInfo;
  public users: Record<number, UserInfo> = {};

  constructor(readonly options: Options) {
    this.model = options.editor.getModel()!;
    this.onChangeHandle = options.editor.onDidChangeModelContent((e) =>
      this.onChange(e)
    );
    const interval = options.reconnectInterval ?? 1000;
   // this.tryConnect();
 //   this.tryConnectId = window.setInterval(() => this.tryConnect(), interval);
    this.resetFailuresId = window.setInterval(
      () => (this.recentFailures = 0),
      15 * interval
    );
  }

  dispose() {
//    window.clearInterval(this.tryConnectId);
    window.clearInterval(this.resetFailuresId);
    this.onChangeHandle.dispose();
    this.ws?.close();
  }

  // private tryConnect() {
  //   if (this.connecting || this.ws) return;
  //   this.connecting = true;
  //   const ws = new WebSocket(this.options.uri);
  //   ws.onopen = () => {
  //     this.connecting = false;
  //     this.ws = ws;
  //     this.sendInfo();
  //     ws.send("This is a new connection");
  //   };
  //   ws.onclose = () => {
  //     if (this.ws) {
  //       this.ws = undefined;
  //       if (++this.recentFailures >= 5) {
  //         // If we disconnect 5 times within 15 reconnection intervals, then the
  //         // client is likely desynchronized and needs to refresh.
  //         this.dispose();
  //         this.options.onDesynchronized?.();
  //       }
  //     } else {
  //       this.connecting = false;
  //     }
  //   };
  //   ws.onmessage = ({ data }) => {
  //     try {
  //       const json = JSON.parse(data);
  //       json.users.forEach((user: string, i: number) => {
  //         let userInfo: UserInfo = {
  //           name: user
  //         };
  //         this.users[i] = userInfo;
  //       });
  //       console.log(this.users)
  //       this.options.onChangeUsers?.(this.users);
  //     }
  //     catch (e) {
  //       if (data === "This is a new connection") {
  //         ws.send(this.model.getValue());
  //       }
  //       else if (data !== this.model.getValue()) {
  //         this.model.setValue(data);
  //       }
  //     }
  //     this.ignoreChanges = false;
  //   }
  // }


  public onChange(event: editor.IModelContentChangedEvent) {
    if (!this.ignoreChanges) {
      this.ignoreChanges = true;
      console.log(event.changes);
      this.currentValue = this.model.getValue();
      this.ws?.send(this.currentValue);
    }
  }

  public sendInfo() {
    if (this.myInfo) {
      this.ws?.send(`{"ClientInfo":${JSON.stringify(this.myInfo)}}`);
    }
  }
}

export default TextEditor;
