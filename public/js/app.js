const socket = io();
const welcome = document.getElementById("welcome");
const roomForm = document.getElementById("room-form");
const chatContainer = document.getElementById("chat-container");
const messages = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const roomListHeader = document.getElementById("header-room-list__title");
const roomList = document.getElementById("header-room-list");

let chatRoomName = "";
let nickname = "DefaultName-" + Math.ceil(Math.random()*1000);
let participants = [];

socket.on("joined", (nick) => {
    if(nick) {
        messageAdd(`${nick} joined room.`)
    }
});

socket.on("receive", (nickname, msg) => {
    if(nickname && msg) {
        messageAdd(`${nickname} : ${msg}`);
    }
});

function onLoad() {
    chatContainer.style.visibility = "hidden";
}

function messageAdd(msg) {
    const li = document.createElement("li");
    li.innerText = msg;
    messages.appendChild(li);
}

function onSendMessageReturned(msg) {
    messageAdd("You : " + msg);
}

function onConnected() {
    console.log(socket);
    welcome.style.display = "none";
    chatContainer.style.visibility = "visible";
    messageAdd("You've joined chat room")
}

function handleSubmitRoom(event) {
    event.preventDefault();
    const name = document.getElementById("room-name");
    const nick = document.getElementById("room-nick");
    socket.emit("enter_room", name.value, nick.value, onConnected);
    chatRoomName = name.value;
    name.value = "";

}

function handleSubmitMessage(event) {
    event.preventDefault();
    if(chatRoomName === "" || !chatRoomName) {
        alert("Something wrong");
        return;
    }
    const input = messageForm.querySelector("input");
    socket.emit("send_message", chatRoomName, nickname, input.value, onSendMessageReturned);
    input.value = "";
}



window.addEventListener("load", onLoad);
roomForm.addEventListener("submit", handleSubmitRoom);
messageForm.addEventListener("submit", handleSubmitMessage);