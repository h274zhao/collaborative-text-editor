import React from "react";
import "./App.css";

function App() {
  const start = () => {
    import("collaborative-text-editor").then((wasm) => {
      wasm.greet();
      wasm.start_websocket();
      console.log("All modules loaded");
    });
  };

  start();

  return <div> React App, typescript with wasm </div>;
}

export default App;
