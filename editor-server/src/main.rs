use warp::{Rejection, Filter};
use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::{mpsc, RwLock};
use warp::ws::Message;
use std::sync::atomic::AtomicUsize;
use names::{Generator};
use std::convert::Infallible;

// Modules
mod handler;
mod ws;
mod room;

// Types
type Result<T> = std::result::Result<T, Rejection>;
type Users = Arc<RwLock<HashMap<usize, User>>>;
type Rooms = Arc<RwLock<HashMap<String, Room>>>;

pub static NEXT_USER_ID: AtomicUsize = AtomicUsize::new(1); //int type: safely shared between threads.

//Structs
#[derive(Debug, Clone)]
pub struct User {
    pub user_name: String,
    pub sender: mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>
}

#[derive(Debug, Clone)]
pub struct Room {
    pub room_uuid: String,
    pub room_name: String,
    pub users: Users
}

impl User {
    pub fn new(sender: mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>) -> Self{
        let mut generator = Generator::default();
        Self {
            user_name: generator.next().unwrap(),
            sender
        }
    }
}

impl Room {
    pub fn new(room_uuid: String, room_name: String) -> Self {
        Self {
            room_uuid,
            room_name,
            users: Users::default()
        }
    }
}

#[tokio::main]
async fn main() {
    let rooms: Rooms = Rooms::default();

    let ws_editor_route = warp::path("editor")
        .and(warp::ws())
        .and(warp::path::param())
        .and(warp::path::param())
        .and(with_rooms(rooms.clone()))
        .and_then(handler::ws_handler);

    let room = warp::path("rooms");
    let room_route = room
        .and(warp::post())
        .and(warp::body::json())
        .and(with_rooms(rooms.clone()))
        .and_then(handler::room_register_handler)
        .or(room
            .and(warp::delete())
            .and(warp::path::param())
            .and(with_rooms(rooms.clone()))
            .and_then(handler::room_unregister_handler))
        .or(
            room
            .and(warp::get())
            .and(with_rooms(rooms.clone()))
            .and_then(handler::room_lookup_handler));

    let routes = ws_editor_route
        .or(room_route)
        .with(warp::cors()
            .allow_any_origin()
            .allow_headers(vec!["Content-Type", "User-Agent", "Sec-Fetch-Mode", "Referer", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers", "content-type"])
            .allow_methods(vec!["OPTIONS", "GET", "POST", "DELETE", "PUT"]));
    warp::serve(routes).run(([127, 0, 0, 1], 8000)).await;
}

fn with_rooms(rooms: Rooms) -> impl Filter<Extract = (Rooms,), Error = Infallible> + Clone {
    warp::any().map(move || rooms.clone())
}