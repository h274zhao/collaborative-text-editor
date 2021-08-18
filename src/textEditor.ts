import type { editor, IDisposable, IPosition ,} from "monaco-editor/esm/vs/editor/editor.api";
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
  readonly hue: number;
};
class TextEditor {
	private ws?: WebSocket;
	private recentFailures: number = 0;
	private connecting?: boolean;
	private readonly model: editor.ITextModel;
	private readonly onChangeHandle: IDisposable;
	private readonly tryConnectId: number;
  private readonly resetFailuresId: number;


	private currentValue: string = "";
	private ignoreChanges: boolean = false;

	private me: number = -1;
	private revision: number = 0;
	private buffer?: OpSeq;
	private myInfo?: UserInfo;
	private users: Record<number, UserInfo> = {};

	constructor(readonly options: Options) {
		this.model = options.editor.getModel()!;
		this.onChangeHandle = options.editor.onDidChangeModelContent((e) =>
			this.onChange(e)
		);
		const interval = options.reconnectInterval ?? 1000;
    this.tryConnect();
    this.tryConnectId = window.setInterval(() => this.tryConnect(), interval);
    this.resetFailuresId = window.setInterval(
      () => (this.recentFailures = 0),
      15 * interval
    );
	}

	dispose() {
    window.clearInterval(this.tryConnectId);
    window.clearInterval(this.resetFailuresId);
    this.onChangeHandle.dispose();
    this.ws?.close();
  }

	private tryConnect() {
    if (this.connecting || this.ws) return;
    this.connecting = true;
    const ws = new WebSocket(this.options.uri);
    ws.onopen = () => {
      this.connecting = false;
      this.ws = ws;
      this.users = {};
      this.sendInfo();
      ws.send("This is a new connection");
    };
    ws.onclose = () => {
      if (this.ws) {
        this.ws = undefined;
        if (++this.recentFailures >= 5) {
          // If we disconnect 5 times within 15 reconnection intervals, then the
          // client is likely desynchronized and needs to refresh.
          this.dispose();
          this.options.onDesynchronized?.();
        }
      } else {
        this.connecting = false;
      }
    };

    ws.onmessage = (msg) => {

      if(msg.data === "This is a new connection") {
        ws.send(this.model.getValue());
      }
      else if(msg.data !== this.model.getValue()) {
      this.model.setValue(msg.data);
      this.currentValue = msg.data;
      }
      this.ignoreChanges = false;
    }
  }

	private onChange(event: editor.IModelContentChangedEvent) {
    if(!this.ignoreChanges) {
      this.ignoreChanges = true;
      console.log(event.changes);
      this.currentValue = this.model.getValue();
      this.ws?.send(this.currentValue);
    }
	}

	private sendInfo() {
		if (this.myInfo) {
			this.ws?.send(`{"ClientInfo":${JSON.stringify(this.myInfo)}}`);
		}
	}
}

export default TextEditor;
