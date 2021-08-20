import { link } from "fs";
import type { editor, IDisposable, IPosition, } from "monaco-editor/esm/vs/editor/editor.api";
import { OpSeq, OpSeqPair } from "rust-wasm";


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
  private prevOp: OpSeq = OpSeq.new();
  private currentValue: string = "";
  private ignoreChanges: boolean = false;
  private lastValue: string = "";
  private version: number = 0;
  private me: number = -1;
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
    /*
    window.clearInterval(this.tryConnectId);
    window.clearInterval(this.resetFailuresId);
    this.onChangeHandle.dispose();
    */
    this.ws?.close();
  }

  private tryConnect() {
    if (this.connecting || this.ws) return;
    this.connecting = true;
    const ws = new WebSocket(this.options.uri);
    ws.onopen = () => {
      console.log("connected");
      this.ws = ws;
    };
    ws.onclose = () => {
      console.log("disconnected");
    };

    // try {


    // }
    // catch (e) {
    //   if (data === "This is a new connection") {
    //     ws.send(this.model.getValue());
    //   }
    //   else if (data !== this.model.getValue()) {
    //     this.model.setValue(data);


    ws.onmessage = ({ data }) => {

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

        if (json.version == this.version) {
          console.log("racing condition");
          //racing condition
          const curOperation = this.operation(data);
          //transform between preOp and curOperation
          const pair = this.prevOp.transform(curOperation)!;
          //const buffer = this.prevOp.compose(pair.second());
          var content = (pair.second()).apply(this.model.getValue());
          if (content != null) {
            this.model.setValue(content);
          }
        }
        else if (json.version < this.version) {
          console.log("it is imposible to happen");
          
        }
        else {
          this.version = json.version;
          const operation = this.operation(data);
          this.prevOp = operation;
          const content = operation.apply(this.model.getValue());
          if (content != null) {
            this.model.setValue(content);
          }
        }
      }
    };
  }
  private operation(data: string) {
    const json = JSON.parse(data);
    if (json.operation === "") {
      //delete
      const operation = OpSeq.new();
      if (json.offset == this.model.getValue().length) {
        operation.retain(json.offset);
        operation.delete(1);
      }
      else if (json.offset > this.model.getValue().length) {
        console.log("werid thing happened");
        //do nothing
      }
      else {
        const txtTmp = this.model.getValue();
        operation.retain(json.offset);
        var index = this.model.getValue().length - json.offset;
        operation.delete(index);
        //operation.delete(1);
        operation.insert(txtTmp.substring(json.offset + 1));
      }
      return operation;
    }
    else {
      //insert
      const operation = OpSeq.new();

      if (json.offset == this.model.getValue().length) {
        operation.retain(json.offset);
        operation.insert(json.operation);

      }
      else if (json.offset > this.model.getValue().length) {
        console.log("werid thing happened");
        //do nothing
      }
      else {
        const txtTmp = this.model.getValue();
        operation.retain(json.offset);
        var index = this.model.getValue().length - json.offset;
        operation.delete(index);
        operation.insert(json.operation);
        operation.insert(txtTmp.substring(json.offset));
      }
      return operation;
    }
    
  }
  private onChange(event: editor.IModelContentChangedEvent) {
    if (event.isFlush) {

    }
    else {
      //version ++
      this.version = this.version + 1;
      const current = this.lastValue;
      let offset = 0;

      let currentOp = OpSeq.new();

      event.changes.sort((a, b) => b.rangeOffset - a.rangeOffset);
      for (const change of event.changes) {
        // destructure the change
        const { text, rangeOffset, rangeLength } = change;
        let info: opInfo = { operation: text, offset: rangeOffset, version: this.version};
        this.ws?.send(JSON.stringify(info));
        this.prevOp = this.operation(JSON.stringify(info));
      }


    }
  }
}


interface opInfo {
  operation: any;
  offset: number;
  version: number;
}
export default TextEditor;
