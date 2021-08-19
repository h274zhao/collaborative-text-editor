import { useState } from 'react';
import TextEditor from './page/TextEditor';
import Register from './page/Register';
import './App.css';


export default function App() {
  const [inRoom, setInRoom] = useState(false)
  const [ws, setWs] = useState("")

  const toggleInRoom = () => setInRoom(!inRoom);

  let screen = inRoom ? <TextEditor ws={ws}/> : <Register toggleInRoom={toggleInRoom} setWs={setWs} />

  return (
    <div>
      {screen}
    </div>
  );
}
