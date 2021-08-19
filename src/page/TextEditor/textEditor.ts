import type { editor, IDisposable } from "monaco-editor/esm/vs/editor/editor.api";
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
  private ws?: WebSocket;
  private recentFailures: number = 0;
  private connecting?: boolean;
  private readonly model: editor.ITextModel;
  private readonly onChangeHandle: IDisposable;
  private readonly tryConnectId: number;
  private readonly resetFailuresId: number;


  private lastValue: string = "";

  private me: number = -1;
  private revision: number = 0;
  private outstanding?: OpSeq;
  private buffer?: OpSeq;
  private myInfo?: UserInfo;
  private users: Record<number, UserInfo> = {};

  constructor(readonly options: Options) {
    this.model = options.editor.getModel()!;
    this.tryConnect();

    this.onChangeHandle = options.editor.onDidChangeModelContent((e) =>
      this.onChange(e)
    );
    const interval = options.reconnectInterval ?? 1000;
    this.tryConnectId = window.setInterval(() => this.tryConnect(), interval);
    this.resetFailuresId = window.setInterval(
      () => (this.recentFailures = 0),
      15 * interval
    );
  }

  dispose() {
    this.ws?.close();
  }

  private tryConnect() {
    if (this.connecting || this.ws) return;
    this.connecting = true;
    const ws = new WebSocket(this.options.uri);
    ws.onopen = () => {
      console.log("connected");
      this.ws = ws;
      this.ws?.send("New connection");
    };
    ws.onclose = () => {
      console.log("disconnected");
    };

    ws.onmessage = ({ data }) => {

      const position: any = this.options.editor.getPosition();
      try {
      const json = JSON.parse(data);

      if (json.users) {
        this.users = {}
        json.users.forEach((user: string, i: number) => {
          let userInfo: UserInfo = {
            name: user
          };
          this.users[i] = userInfo;
        });
        console.log(this.users)
        this.options.onChangeUsers?.(this.users);
      }
      else {
        if (json.operation === "") {
          //delete
          const operation = OpSeq.new();
          if (json.offset == this.model.getValue().length) {
            operation.retain(json.offset);
            operation.delete(1);
          }
          else if (json.offset > this.model.getValue().length) {
            console.log("weird thing happened");
          }
          else {
            console.log("text length");
            console.log(this.model.getValue().length);
            console.log("offset");
            console.log(json.offset);

            const txtTmp = this.model.getValue();
            operation.retain(json.offset);
            var index = this.model.getValue().length - json.offset;
            operation.delete(index);
            operation.insert(txtTmp.substring(json.offset + 1));
          }

          const asd = operation.apply(this.model.getValue());
          if (asd != null) {
            this.model.setValue(asd);
            this.options.editor.setPosition(position);
          }
        }
        else {
          //insert
          const operation = OpSeq.new();

          if (json.offset == this.model.getValue().length) {
            operation.retain(json.offset);
            operation.insert(json.operation);

          }
          else if (json.offset > this.model.getValue().length) {
            console.log("weird thing happened");
          }
          else {
            const txtTmp = this.model.getValue();
            operation.retain(json.offset);
            var index = this.model.getValue().length - json.offset;
            operation.delete(index);
            operation.insert(json.operation);
            operation.insert(txtTmp.substring(json.offset));
          }
          const asd = operation.apply(this.model.getValue());
          if (asd != null) {
            this.model.setValue(asd);
            this.options.editor.setPosition(position);
          }
        }
      }
    }
    catch (err) {
      if (data === "New connection") {
        this.ws?.send(this.model.getValue());
      }
      else {
        this.model.setValue(data);
        this.lastValue = data;
        this.options.editor.setPosition(position);
      }
    }
    };
  }
  private onChange(event: editor.IModelContentChangedEvent) {
    if (event.isFlush) {
    }
    else {
      event.changes.sort((a, b) => b.rangeOffset - a.rangeOffset);
      for (const change of event.changes) {
        const { text, rangeOffset, rangeLength } = change;
        if (text.length > 1 || (text === "" && this.lastValue.length - text.length > 1)) {
          this.ws?.send(this.model.getValue());
        }
        else {
          let info: opInfo = { operation: text, id: NaN, offset: rangeOffset };
          this.ws?.send(JSON.stringify(info));
        }
        this.lastValue = this.model.getValue();
      }
    }
  }
}
interface opInfo {
  id: number;
  operation: any;
  offset: number;
}
export default TextEditor;
