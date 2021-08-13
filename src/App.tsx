import React from "react";
import "./App.css";

function App() {
  (() => {
    import("collaborative-text-editor").then((wasm) => {
      wasm.greet();
    });
  })();

  return <div> React App, typescript with wasm </div>;
}

export default App;
