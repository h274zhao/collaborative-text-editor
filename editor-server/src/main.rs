use warp::{Rejection, Filter};
use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::{mpsc, RwLock};
use warp::ws::Message;
use std::sync::atomic::AtomicUsize;
use names::{Generator, Name};

// Modules
mod handler;
mod ws;

// Types
type Result<T> = std::result::Result<T, Rejection>;
type Users = Arc<RwLock<HashMap<usize, User>>>;     //userid, User

pub static NEXT_USER_ID: AtomicUsize = AtomicUsize::new(1); //int type: safely shared between threads.

//Structs
#[derive(Debug, Clone)]
pub struct User {
    pub user_name: String,
    pub sender: mpsc::UnboundedSender<std::result::Result<Message, warp::Error>>
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

#[tokio::main]
async fn main() {
    let users: Users = Users::default();

    let ws_editor_route = warp::path("editor")
        .and(warp::ws())
        .and(warp::any().map(move || users.clone()))
        .and_then(handler::ws_handler);

    let routes = ws_editor_route;
    warp::serve(routes).run(([127, 0, 0, 1], 8000)).await;
}