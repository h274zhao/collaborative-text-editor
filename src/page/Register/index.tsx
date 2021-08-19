import { TextField } from '@material-ui/core'
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';
import axios from 'axios'
import { useEffect, useState } from 'react'

import "./styles.css"

export default function Register(props: any) {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState("")
  const [newRoomName, setNewRoomName] = useState("")

  useEffect(() => {
    axios
      .get("http://localhost:8000/rooms")
      .then(res => res.data)
      .then(({ rooms }) => {
        setRooms(rooms)
      })
  }, [])

  const createRoom = () => {
    axios
      .post("http://localhost:8000/rooms", {
        room_name: newRoomName,
      })
      .then(res => res.data)
      .then(data => {
        const uuid = data.url.substring(data.url.lastIndexOf('/') + 1)
        props.setWs(`/${newRoomName}/${uuid}`)
        props.toggleInRoom()
      })
  }

  return (
    <div>
      <div className="register_room">
        <div>
          <h3>Register Room</h3>
          <TextField
            label="Room Name"
            variant="outlined"
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <button className="btn" onClick={() => createRoom()}>
            Register
          </button>
        </div>
      </div>
      <div className="join_room">
        <div>
          <h3>Join Room</h3>
          <Dropdown
            options={rooms.map((room: any) => room?.room_name)}
            placeholder="Select Room"
            onChange={(e) => setSelectedRoom(e.value)}
          />
          <button className="btn" onClick={() => {
            let ws: any = rooms.filter((room: any) => room?.room_name === selectedRoom)[0]
            props.setWs(`/${ws?.room_name}/${ws?.room_uuid}`)
            props.toggleInRoom()
          }}>
            Join
          </button>
        </div>
      </div>
    </div>
  )
}
