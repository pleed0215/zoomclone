// socket io instance
const socket = io();

// form elements.
const formEnterRoom = document.getElementById("enter-room__form");
const enterRoomMessage = document.getElementById("enter-room__message");
const nickname = formEnterRoom.querySelector("input[name='nickname']");
const roomName = formEnterRoom.querySelector("input[name='room-name']");

// chat container elements.
const container = document.getElementById("container");
const chatList = document.getElementById("chat-list");
const myFace = document.getElementById("my-face");
const peerFace = document.getElementById("peer-face");
const cameraList = document.getElementById("camera-list");

// for camera & stream
let myPeerConnection = null;
let myStream = null;
let peerStream = null;

async function getMedia() {
    try {
        await setCameraSelect();
        /* 스트림 사용 */
        await updateStream();
        myFace.onloadedmetadata = function (e) {
            myFace.volume = 0.1;
            myFace.play();
        }
    } catch (err) {
        alert(err);
    }
}


async function getCameras() {
    try {
        let infos = await navigator.mediaDevices.enumerateDevices();
        let cameras = infos.filter(device => device.kind === "videoinput");
        return cameras;
    } catch (e) {
        console.log(e);
    }
}

async function setCameraSelect() {
    try {
        let cameras = await getCameras();
        cameraList.innerHTML = null;
        const option = document.createElement("option");
        option.innerText = cameras.length > 0 ? "Select Camera" : "No Camera available";
        option.disabled = true;
        cameraList.append(option);
        if (cameras.length > 0) {
            cameras.forEach(
                (camera, index) => {
                    const option = document.createElement("option");
                    const currentCamera = myStream?.getVideoTracks()[0];
                    option.value = camera.deviceId;
                    option.label = camera.label;
                    if (currentCamera) {
                        option.selected = currentCamera?.label === camera.label;
                    } else {
                        option.selected = index === 0;
                    }
                    cameraList.append(option);
                }
            )
        }
    } catch (e) {
        console.log(e);
    }
}

async function updateStream(deviceId) {
    if (deviceId) {
        myStream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: {
                    deviceId,
                    facingMode: "user"
                },
            }
        );
        myFace.srcObject = myStream;
    } else {
        const cameras = await getCameras();
        if (cameras.length > 0) {
            myStream = await navigator.mediaDevices.getUserMedia(
                {
                    audio: true,
                    video: {
                        deviceId: cameras[0].deviceId,
                        facingMode: "user"
                    },
                }
            );
            myFace.srcObject = myStream;
        }
    }
}


function addMessage(msg, classes) {
    const ul = chatList.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = msg;
    classes.push("mb-1");
    classes.forEach(className => li.classList.add(className));

    ul.append(li);
}

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
navigator.mediaDevices.addEventListener("devicechange", async () => {
    await setCameraSelect();
    await updateStream();
})
cameraList.addEventListener("change", async function (event) {
    await updateStream(event.target.value);
    if (myPeerConnection) {
        const sender =
            myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
        const videoTrack = myStream.getVideoTracks()[0];
        await sender.replaceTrack(videoTrack);
    }
})

// Socket codes
function nicknames(nicknames) {
    if(nicknames.findIndex(nick => nick === nickname.value) !== -1) {
        enterRoomMessage.innerText = "이미 존재하는 닉네임입니다."
        return;
    }

    socket.emit("enter_room", roomName.value, nickname.value, afterEnterRoom)
}

async function afterEnterRoom() {
    formEnterRoom.classList.add("hidden");
    container.classList.remove("hidden");
    addMessage("방에 참가했습니다.", ["font-bold", "text-xs"]);
    try {
        await getMedia();
    } catch (e) {
        console.log(e);
    }
}

