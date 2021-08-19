use crate::{Result, Rooms};
use crate::ws::user_connection;
use crate::room::register_room;

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use warp::{http::StatusCode, reply::json, Reply};


#[derive(Deserialize, Debug)]
pub struct RegisterRequest {
    room_name: String,
}

#[derive(Deserialize, Debug)]
pub struct UnregisterRequest {
    room_uuid: String,
}

#[derive(Serialize, Debug)]
pub struct RegisterResponse {
    url: String,
}

#[derive(Serialize, Debug)]
pub struct RoomsResponse {
    rooms: Vec<RoomResponseItem>
}

#[derive(Serialize, Debug)]
struct RoomResponseItem {
    room_uuid: String,
    room_name: String,
}

pub async fn ws_handler(ws: warp::ws::Ws, room_name: String, room_uuid: String, rooms: Rooms) -> Result<impl Reply> {
    println!("{}", room_name);
    println!("{}", room_uuid);
    Ok(ws.on_upgrade(move |socket| user_connection(socket, room_name, room_uuid, rooms.clone())))
}

pub async fn room_register_handler(body: RegisterRequest, rooms: Rooms) -> Result<impl Reply> {
    let room_name = body.room_name;
    let uuid = Uuid::new_v4().simple().to_string();

    register_room(uuid.clone(), room_name.clone(), rooms).await;
    Ok(json(&RegisterResponse {
        url: format!("ws://127.0.0.1:8000/editor/{}/{}", room_name, uuid),
    }))
}

pub async fn room_unregister_handler(room_uuid: String, rooms: Rooms) -> Result<impl Reply> {
    rooms.write().await.remove(&room_uuid);
    Ok(StatusCode::OK)
}

pub async fn room_lookup_handler(rooms: Rooms) -> Result<impl Reply> {
    let mut rooms_res: Vec<RoomResponseItem> = vec![];

    for (uuid, room) in rooms.read().await.iter() {
        rooms_res.push(RoomResponseItem{
            room_uuid: (*uuid).parse()?,
            room_name: (*room.room_name).parse()?
        })
    }
    Ok(json(&RoomsResponse {
        rooms: rooms_res
    }))
}