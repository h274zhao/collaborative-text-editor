import { useEffect, useState, useRef } from 'react';
import logo from './logo.svg';
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import TextEditor from "./textEditor";
import useHash from "./useHash"

import './App.css';
//TO-DO: need to do change the code to match our own server implementation
function getWsUri(id: string) {
  return (
    (window.location.origin.startsWith("https") ? "wss://" : "ws://") +
    window.location.host +
    `/api/socket/${id}`
  );
}

function App() {
  const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
  const textEditor = useRef<TextEditor>();
  const id = useHash();

  useEffect(() => {
    if (editor?.getModel()) {
      const model = editor.getModel()!;
      model.setValue("");
      model.setEOL(0);
      textEditor.current = new TextEditor({
        uri: getWsUri(id),
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
