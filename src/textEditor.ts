import type { editor, IDisposable, IPosition ,} from "monaco-editor/esm/vs/editor/editor.api";

export type Options = {
	//readonly uri: string;
	readonly editor: editor.IStandaloneCodeEditor;
};

class TextEditor {
	private readonly model: editor.ITextModel;
	private readonly onChangeHandle: IDisposable;

	private currentValue: string = "";
	private ignoreChanges: boolean = false;

	constructor(readonly options: Options) {
		this.model = options.editor.getModel()!;
		this.onChangeHandle = options.editor.onDidChangeModelContent((e) =>
			this.onChange(e)
		);
	}

	private onChange(event: editor.IModelContentChangedEvent) {
		//fires when there is a change to the text in the code
		/*first we check for any current changes
			then we check to see what should be changed
			we apply the changes to the client
			we refresh the currentvalue through the model's value.
		*/
	}
}

export default TextEditor;
