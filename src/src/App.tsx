import React from "react";
import "./App.css";

function App() {
  (() => {
    import("collaborative-text-editor").then((wasm) => {
      wasm.greet();
      wasm.start_websocket();
    });
  })();

  return <div> React App, typescript with wasm </div>;
}

export default App;
