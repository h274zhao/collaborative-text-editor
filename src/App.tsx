import { useEffect, useState, useRef } from 'react';
import logo from './logo.svg';
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import TextEditor from "./textEditor";
import './App.css';

function App() {
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const textEditor = useRef<TextEditor>();

  useEffect(() => {
    if (editor?.getModel()) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0);
      textEditor.current = new TextEditor({
        editor,
      })
    }
  }, [editor])
  return (
    <div className="App" >
      <div className="editor">
        <Editor
          onMount={(editor) => setEditor(editor)}
          />
      </div>
    </div>
  );
}

export default App;
