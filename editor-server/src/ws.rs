use warp::ws::{WebSocket, Message};
use crate::{Users, NEXT_USER_ID, User};
use std::sync::atomic::Ordering;
use tokio::sync::mpsc;
use futures::{FutureExt, StreamExt};                        //FutureExt needed or u get "trait bounds were not satisfied"
use tokio_stream::wrappers::UnboundedReceiverStream;
use serde_json::json;
use serde::{Serialize, Deserialize};
use serde_json::{Result, Value};


pub async fn user_connection(ws: WebSocket, users: Users) {
    let (user_ws_sender, mut user_ws_receiver) = ws.split();
    let (user_sender, user_receiver) = mpsc::unbounded_channel();
    let user_receiver = UnboundedReceiverStream::new(user_receiver);

    tokio::task::spawn(user_receiver.forward(user_ws_sender).map(|result| {
        if let Err(e) = result {
            eprintln!("error sending websocket msg: {}", e);
        }
    }));

    let new_user = User::new(user_sender);
    let user_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);   //add 1 to user id, but return original
    eprintln!("hi user: {}", user_id);

    users.write().await.insert(user_id.clone(), new_user);
    send_user_list(&users).await;

    while let Some(result) = user_ws_receiver.next().await {
        let msg = match result {
            Ok(msg) => msg,
            Err(e) => {
                eprintln!("error receiving ws message for id: {}): {}", user_id, e);
                break;
            }
        };
        user_message(user_id, msg, &users).await;
    }
    user_disconnected(user_id, &users).await;
}

async fn user_message(my_id: usize, msg: Message, users: &Users) {
    // Skip any non-Text messages...
    let msg = if let Ok(s) = msg.to_str() {
        s
    } else {
        return;
    };
    /*
    let deserialized: Value = serde_json::from_str(msg).unwrap();
    deserialized["offset"] = my_id;
    let serialized = serde_json::to_string(&deserialized).unwrap();
    */
    //let serialized: Value = serde_json::to_string(&deserialized).unwrap();
    eprintln!("SERVER: msg sent by {} is {}", my_id, msg);
    for (&uid, user) in users.read().await.iter() {
        //before send, check if the user's version has the same version number as the operation
        //if does, then there is a concurrenc race, need to use tranform!!!
        if my_id != uid {
           if let Err(_disconnected) = user.sender.send(Ok(Message::text(msg))) {}
           //after send, check update the version
        }
    }
}


async fn user_disconnected(my_id: usize, users: &Users) {
    eprintln!("good bye user: {}", my_id);
    users.write().await.remove(&my_id);

    send_user_list(&users).await;
}

async fn send_user_list(users: &Users) {
    //Create an array of each users name
    let mut userslist: Vec<String> = vec![];
    for (&uid, user) in users.read().await.iter() {
        userslist.push(user.clone().user_name);
    }

    //send all usernames to each user
    for (&uid, user) in users.read().await.iter() {
        user.sender.send(Ok(Message::text(
            json!({"users": userslist}).to_string()
        )));
    }
}