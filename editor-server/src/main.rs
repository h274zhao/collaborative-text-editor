use warp::{filters::BoxedFilter, ws::Ws, Rejection, Filter, Reply};
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

fn server() -> BoxedFilter<(impl Reply,)> {
    warp::path("api")
        .and(backend())
        .or(frontend())
        .boxed()
}

fn frontend() -> BoxedFilter<(impl Reply,)> {
    warp::fs::dir("build").boxed()
}

fn backend() -> BoxedFilter<(impl Reply,)> {

    let users: Users = Users::default();

    let ws_editor_route = warp::path("editor")
        .and(warp::ws())
        .and(warp::any().map(move || users.clone()))
        .and_then(handler::ws_handler);

    ws_editor_route.boxed()
}

#[tokio::main]
async fn main() {

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| String::from("3030"))
        .parse()
        .expect("Unable to parse PORT");

    // let routes = ws_editor_route;
    warp::serve(server()).run(([0, 0, 0, 0], port)).await;
}
