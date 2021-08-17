use crate::{Users, Result};
use crate::ws::user_connection;

use warp::Reply;

pub async fn ws_handler(ws: warp::ws::Ws, users: Users) -> Result<impl Reply> {
    Ok(ws.on_upgrade(move |socket| user_connection(socket, users.clone())))
}