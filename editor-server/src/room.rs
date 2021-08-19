use crate::{Rooms, Room};

pub async fn register_room(room_uuid: String, room_name: String, rooms: Rooms) -> Option<Room> {
    let new_room = Room::new(room_uuid.clone(), room_name);
    rooms.write().await.insert(
        room_uuid,
        new_room
    )
}