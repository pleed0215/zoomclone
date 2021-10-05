// form elements.
const formEnterRoom = document.getElementById("enter-room__form");
const enterRoomMessage = document.getElementById("enter-room__message");
const nickname = formEnterRoom.querySelector("input[name='nickname']");
const roomName = formEnterRoom.querySelector("input[name='room-name']");

// chat container elements.
const container = document.getElementById("container");

const socket = io();

// Event handlers
async function onSubmitEnterRoom(event) {
    event.preventDefault();
    if(!nickname.value || !roomName.value) {
        enterRoomMessage.innerText = "값이 비어 있으면 안됩니다";
        return;
    }

    socket.emit("request_nicknames", nicknames);
}

// Events
formEnterRoom.addEventListener("submit", onSubmitEnterRoom);
// socket event handlers
socket.on("joined", () => {
    console.log("Joined the room");
})

// Socket codes
function nicknames(nicknames) {
    if(nicknames.findIndex(nick => nick === nickname.value) !== -1) {
        enterRoomMessage.innerText = "이미 존재하는 닉네임입니다."
        return;
    }

    socket.emit("enter_room", roomName.value, nickname.value, afterEnterRoom)
}

function afterEnterRoom() {
    formEnterRoom.classList.add("hidden");
    container.classList.remove("hidden");
}

