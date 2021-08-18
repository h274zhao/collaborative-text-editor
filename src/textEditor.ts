import { link } from "fs";
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


	private lastValue: string = "";
	private ignoreChanges: boolean = false;

	private me: number = -1;
	private revision: number = 0;
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
    ws.onmessage = (msg) => {

      var object = JSON.parse(msg.data);
      if (object.operation === "") {
        //delete
        const operation = OpSeq.new();
        if (object.offset == this.model.getValue().length){
          operation.retain(object.offset);
          operation.delete(1);
        }
        else if (object.offset > this.model.getValue().length){
          console.log("werid thing happened");
          //do nothing
        }
        else {
          console.log("text length");
          console.log(this.model.getValue().length);
          console.log("offset");
          console.log(object.offset);
          
          const txtTmp = this.model.getValue();
          operation.retain(object.offset);
          var index = this.model.getValue().length-object.offset;
          operation.delete(index);
          //operation.delete(1);
          operation.insert(txtTmp.substring(object.offset+1));
        }

        const asd = operation.apply(this.model.getValue());
        if (asd != null){
          this.model.setValue(asd);
        }
      }
      else {
        //insert
        const operation = OpSeq.new();

        if (object.offset == this.model.getValue().length){
          operation.retain(object.offset);
          operation.insert(object.operation);
        
        }
        else if (object.offset > this.model.getValue().length) {
          console.log("werid thing happened");
          //do nothing
        }
        else {
          const txtTmp = this.model.getValue();
          operation.retain(object.offset);
          var index = this.model.getValue().length-object.offset;
          operation.delete(index);
          operation.insert(object.operation);
          operation.insert(txtTmp.substring(object.offset));
        }
        const asd = operation.apply(this.model.getValue());
        if (asd != null){
          this.model.setValue(asd);
        }
      }
      
    };
  }
  	private onChange(event: editor.IModelContentChangedEvent) {
      if(event.isFlush){

      }
      else{
        const current = this.lastValue;
        let offset = 0;
  
        let currentOp = OpSeq.new();
  
        event.changes.sort((a, b) => b.rangeOffset - a.rangeOffset);
        for(const change of event.changes) {
          // destructure the change
          const { text, rangeOffset, rangeLength } = change;
          let info: opInfo = { operation: text, id: NaN, offset: rangeOffset};
          this.ws?.send(JSON.stringify(info));
          //this.lastValue = this.model.getValue();
        //this.applyClient(currentOp);
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
