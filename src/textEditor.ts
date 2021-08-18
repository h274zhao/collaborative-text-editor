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

  private operation = OpSeq.new();
	private lastValue: string = "";
	private ignoreChanges: boolean = false;

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
      //ws.send("msg");
      //ws.send("msg1");
      //ws.send("msg2");
      //ws.send("msg3");
      /*
      this.connecting = false;

      this.options.onConnected?.();
      this.users = {};
      this.options.onChangeUsers?.(this.users);
      this.sendInfo();
      if (this.outstanding) {
        this.sendOperation(this.outstanding);
      }
      */
    };
    ws.onclose = () => {
      console.log("disconnected");
    };
    ws.onmessage = (msg) => {
      /*
      console.log("CLIENT: msg is ::: ");
      console.log(msg.data);
      console.log("*****************************");
      console.log(this.lastValue);
      console.log("*****************************");
      */

      var object = JSON.parse(msg.data);
      if (object.operation === "") {
        //delete
        this.operation.delete(object.offset);
        const asd = this.operation.apply(this.lastValue);
        if (asd != null){
          this.model.setValue(asd);
        }
      }
      else {
        //insert
        //this.operation.retain(this.lastValue.length);
        this.operation.insert(object.operation);
        //this.operation.apply(this.lastValue);
        const asd = this.operation.apply(this.lastValue);
        console.log("why this is not working");
        console.log(asd);
        if (asd != null){
          this.model.setValue(asd);
        }
      }
      
    };
  }
  	private onChange(event: editor.IModelContentChangedEvent) {
		if (!this.ignoreChanges) {
			const current = this.lastValue;
			const currentLength = unicodeLength(current);
			let offset = 0;

			let currentOp = OpSeq.new();
			currentOp.retain(currentLength);

			event.changes.sort((a, b) => b.rangeOffset - a.rangeOffset);
			for(const change of event.changes) {
				// destructure the change

        console.log("*****************************");
        console.log(change);
        console.log("*****************************");
				const { text, rangeOffset, rangeLength } = change;
        let info: opInfo = { operation: text, id: NaN, offset: rangeOffset};
				const initialLength = unicodeLength(current.slice(0, rangeOffset));
				const deletedLength = unicodeLength(
					current.slice(rangeOffset, rangeOffset + rangeLength)
				);
				const restLength =
					currentLength + offset - initialLength - deletedLength;
				const changeOp = OpSeq.new();
				changeOp.retain(initialLength);
        changeOp.delete(deletedLength);


        changeOp.insert(text);
        changeOp.retain(restLength);
        currentOp = currentOp.compose(changeOp)!;
        offset += changeOp.target_len() - changeOp.base_len();
        this.ws?.send(JSON.stringify(info));
      }
      //this.applyClient(currentOp);
      this.lastValue = this.model.getValue();

			}
		}
	private applyClient(op: OpSeq) {
		if (!this.outstanding) {
			this.sendOperation(op);
			this.outstanding = op;
		} else if (!this.buffer) {
			this.buffer = op;
		} else {
			this.buffer = this.buffer.compose(op);
		}
	}
  private sendOperation(operation: OpSeq) {
		const op = operation.to_string();
		this.ws?.send(`{"Edit":{"revision":${this.revision},"operation":${op}}}`);
	}
}

function unicodeLength(str: string): number {
  let length = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const c of str) ++length;
  return length;
}

/** Returns the number of Unicode codepoints before a position in the model. */

function unicodeOffset(model: editor.ITextModel, pos: IPosition): number {
  const value = model.getValue();
  const offsetUTF16 = model.getOffsetAt(pos);
  return unicodeLength(value.slice(0, offsetUTF16));
}

/** Returns the position after a certain number of Unicode codepoints. */

function unicodePosition(model: editor.ITextModel, offset: number): IPosition {
  const value = model.getValue();
  let offsetUTF16 = 0;
  for (const c of value) {
    // Iterate over Unicode codepoints
    if (offset <= 0) break;
    offsetUTF16 += c.length;
    offset -= 1;
  }
  return model.getPositionAt(offsetUTF16);
}

interface opInfo {
  id: number;
  operation: any;
  offset: number;
}
/*
  
	private serverAck() {
    if (!this.outstanding) {
      console.warn("Received serverAck with no outstanding operation.");
      return;
    }
    this.outstanding = this.buffer;
    this.buffer = undefined;
    if (this.outstanding) {
      this.sendOperation(this.outstanding);
    }
  }

	private applyServer(operation: OpSeq) {
    if (this.outstanding) {
      const pair = this.outstanding.transform(operation)!;
      this.outstanding = pair.first();
      operation = pair.second();
      if (this.buffer) {
        const pair = this.buffer.transform(operation)!;
        this.buffer = pair.first();
        operation = pair.second();
      }
    }
    this.applyOperation(operation);
  }

	private applyOperation(operation: OpSeq) {
    if (operation.is_noop()) return;

    this.ignoreChanges = true;
    const ops: (string | number)[] = JSON.parse(operation.to_string());
    let index = 0;

    for (const op of ops) {
      if (typeof op === "string") {
        // Insert
        const pos = unicodePosition(this.model, index);
        index += unicodeLength(op);
        this.model.pushEditOperations(
          this.options.editor.getSelections(),
          [
            {
              range: {
                startLineNumber: pos.lineNumber,
                startColumn: pos.column,
                endLineNumber: pos.lineNumber,
                endColumn: pos.column,
              },
              text: op,
              forceMoveMarkers: true,
            },
          ],
          () => null
        );
      } else if (op >= 0) {
        // Retain
        index += op;
      } else {
        // Delete
        const chars = -op;
        var from = unicodePosition(this.model, index);
        var to = unicodePosition(this.model, index + chars);
        this.model.pushEditOperations(
          this.options.editor.getSelections(),
          [
            {
              range: {
                startLineNumber: from.lineNumber,
                startColumn: from.column,
                endLineNumber: to.lineNumber,
                endColumn: to.column,
              },
              text: "",
              forceMoveMarkers: true,
            },
          ],
          () => null
        );
      }
    }
    this.lastValue = this.model.getValue();
    this.ignoreChanges = false;
  }

	private handleMessage(msg: ServerMsg) {
    if (msg.Identity !== undefined) {
      this.me = msg.Identity;
    } else if (msg.History !== undefined) {
      const { start, operations } = msg.History;
      if (start > this.revision) {
        console.warn("History message has start greater than last operation.");
        this.ws?.close();
        return;
      }
      for (let i = this.revision - start; i < operations.length; i++) {
        let { id, operation } = operations[i];
        this.revision++;
        if (id === this.me) {
          this.serverAck();
        } else {
          operation = OpSeq.from_str(JSON.stringify(operation));
          this.applyServer(operation);
        }
      }
    } else if (msg.Language !== undefined) {
      this.options.onChangeLanguage?.(msg.Language);
    } else if (msg.UserInfo !== undefined) {
      const { id, info } = msg.UserInfo;
      if (id !== this.me) {
        this.users = { ...this.users };
        if (info) {
          this.users[id] = info;
        } else {
          delete this.users[id];
        }
        this.options.onChangeUsers?.(this.users);
      }
    }
  }

	private onChange(event: editor.IModelContentChangedEvent) {
		if (!this.ignoreChanges) {
			const current = this.lastValue;
			const currentLength = unicodeLength(current);
			let offset = 0;

			let currentOp = OpSeq.new();
			currentOp.retain(currentLength);

			event.changes.sort((a, b) => b.rangeOffset - a.rangeOffset);
			for(const change of event.changes) {
				// destructure the change
				const { text, rangeOffset, rangeLength } = change;
				const initialLength = unicodeLength(current.slice(0, rangeOffset));
				const deletedLength = unicodeLength(
					current.slice(rangeOffset, rangeOffset + rangeLength)
				);
				const restLength =
					currentLength + offset - initialLength - deletedLength;
				const changeOp = OpSeq.new();
				changeOp.retain(initialLength);
        changeOp.delete(deletedLength);
        changeOp.insert(text);
        changeOp.retain(restLength);
        currentOp = currentOp.compose(changeOp)!;
        offset += changeOp.target_len() - changeOp.base_len();
      }
      this.applyClient(currentOp);
      this.lastValue = this.model.getValue();
			}
		}
  }
	private applyClient(op: OpSeq) {
		if (!this.outstanding) {
			this.sendOperation(op);
			this.outstanding = op;
		} else if (!this.buffer) {
			this.buffer = op;
		} else {
			this.buffer = this.buffer.compose(op);
		}
	}

	private sendOperation(operation: OpSeq) {
		const op = operation.to_string();
		this.ws?.send(`{"Edit":{"revision":${this.revision},"operation":${op}}}`);
	}

	private sendInfo() {
		if (this.myInfo) {
			this.ws?.send(`{"ClientInfo":${JSON.stringify(this.myInfo)}}`);
		}
	}
}

type UserOperation = {
  id: number;
  operation: any;
};

type ServerMsg = {
  Identity?: number;
  History?: {
    start: number;
    operations: UserOperation[];
  };
  Language?: string;
  UserInfo?: {
    id: number;
    info: UserInfo | null;
  };
};
/** Returns the number of Unicode codepoints in a string. */
/*
function unicodeLength(str: string): number {
  let length = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const c of str) ++length;
  return length;
}

/** Returns the number of Unicode codepoints before a position in the model. */
/*
function unicodeOffset(model: editor.ITextModel, pos: IPosition): number {
  const value = model.getValue();
  const offsetUTF16 = model.getOffsetAt(pos);
  return unicodeLength(value.slice(0, offsetUTF16));
}

/** Returns the position after a certain number of Unicode codepoints. */
/*
function unicodePosition(model: editor.ITextModel, offset: number): IPosition {
  const value = model.getValue();
  let offsetUTF16 = 0;
  for (const c of value) {
    // Iterate over Unicode codepoints
    if (offset <= 0) break;
    offsetUTF16 += c.length;
    offset -= 1;
  }
  return model.getPositionAt(offsetUTF16);
}
*/

export default TextEditor;
