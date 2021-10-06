// socket io instance
const socket = io();

// form elements.
const formEnterRoom = document.getElementById("enter-room__form");
const enterRoomMessage = document.getElementById("enter-room__message");
const nickname = formEnterRoom.querySelector("input[name='nickname']");
const roomName = formEnterRoom.querySelector("input[name='room-name']");
const headerTitle = document.querySelector("header").querySelector("h1");

// chat container elements.
const container = document.getElementById("container");
const chatList = document.getElementById("chat-list");
const myFace = document.getElementById("my-face");
const peerFace = document.getElementById("peer-face");
const cameraList = document.getElementById("camera-list");
const btnMute = document.getElementById("my-mute-btn");
const btnCamera = document.getElementById("my-camera-btn");
const chatForm = document.getElementById("chat-form");

// for camera & stream
let isMineMuted = false;
let isMineCameraOff = false;
let myPeerConnection = null;
let myStream = null;
let peerStream = null;
let dataChannel = null;

async function getMedia() {
  try {
    await setCameraSelect();
    /* 스트림 사용 */
    await updateStream();
    myFace.onloadedmetadata = function (e) {
      myFace.volume = 0.1;
      myFace.play();
    };
  } catch (err) {
    alert(err);
  }
}

async function getCameras() {
  try {
    let infos = await navigator.mediaDevices.enumerateDevices();
    let cameras = infos.filter((device) => device.kind === "videoinput");
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
    option.innerText =
      cameras.length > 0 ? "Select Camera" : "No Camera available";
    option.disabled = true;
    cameraList.append(option);
    if (cameras.length > 0) {
      cameras.forEach((camera, index) => {
        const option = document.createElement("option");
        const currentCamera = myStream?.getVideoTracks()[0];
        option.value = camera.deviceId;
        console.log(camera);
        option.label = camera.label;
        option.innerText = camera.label;
        if (currentCamera) {
          option.selected = currentCamera?.label === camera.label;
        } else {
          option.selected = index === 0;
        }
        cameraList.append(option);
      });
    }
  } catch (e) {
    console.log(e);
  }
}

async function updateStream(deviceId) {
  if (deviceId) {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        deviceId,
        facingMode: "user",
        aspectRatio: 1,
        width: 300,
        height: 300,
      },
    });
    myFace.srcObject = myStream;
  } else {
    const cameras = await getCameras();
    if (cameras.length > 0) {
      myStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          deviceId: cameras[0].deviceId,
          facingMode: "user",
          aspectRatio: 1,
          width: 300,
          height: 300,
        },
      });
      myFace.srcObject = myStream;
    }
  }
}

function addMessage(msg, classes) {
  const ul = chatList.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;

  li.classList.add("mb");
  li.classList.add("text-xs");
  if(classes) {
    classes.forEach((className) => li.classList.add(className));
  }

  ul.append(li);
  chatList.scrollTo({
    left: 0,
    top: ul.scrollHeight,
    behavior: "smooth"
  })
}

// Event handlers
async function onSubmitEnterRoom(event) {
  event.preventDefault();
  if (!nickname.value || !roomName.value) {
    enterRoomMessage.innerText = "값이 비어 있으면 안됩니다";
    return;
  }
  socket.emit("request_nicknames", checkNicknames);
}

navigator.mediaDevices.addEventListener("devicechange", async () => {
  await setCameraSelect();
  await updateStream();
});
cameraList.addEventListener("change", async function (event) {
  await updateStream(event.target.value);
  if (myPeerConnection) {
    const sender = myPeerConnection
        .getSenders()
        .find((sender) => sender.track.kind === "video");
    const videoTrack = myStream.getVideoTracks()[0];
    await sender.replaceTrack(videoTrack);
  }
});

function onClickMyMute() {
  isMineMuted = !isMineMuted;
  myStream.getAudioTracks().forEach( track => track.enabled = !isMineMuted);
  btnMute.innerText = isMineMuted ? "마이크 켜기": "마이크 끄기";
}

function onClickMyCamera() {
  isMineCameraOff = !isMineCameraOff;
  myStream.getVideoTracks().forEach( track => track.enabled = !isMineCameraOff);
  btnCamera.innerText = isMineCameraOff ? "카메라 켜기": "카메라 끄기";
}

function onLoad() {
  nickname.value = "기본닉-"+Math.ceil(Math.random()*1000);
  roomName.value = "기본으로 만들어진 방";
}

function onSubmitMessage(event) {
  event.preventDefault();
  const input = chatForm.querySelector("input");
  if(dataChannel && input.value && input.value !== "") {
    const data = {
      from: nickname.value,
      message: input.value
    };
    dataChannel.send(JSON.stringify(data));
    addMessage(`You: ${input.value}`);
    input.value = "";
    input.focus();
  }
}

// Events
formEnterRoom.addEventListener("submit", onSubmitEnterRoom);
chatForm.addEventListener("submit", onSubmitMessage);
btnMute.addEventListener("click", onClickMyMute);
btnCamera.addEventListener("click", onClickMyCamera);
window.addEventListener("load", onLoad);

// socket event handlers

socket.on("joined", async function (peerNick) {
  addMessage(`${peerNick}님과 연결되었습니다.`);

  try {
    dataChannel = myPeerConnection.createDataChannel("my-channel");
    const offer = await myPeerConnection.createOffer();
    await myPeerConnection.setLocalDescription(offer);
    console.log("I send the offer & channel");
    socket.emit("offer", offer, roomName.value);

    dataChannel.onmessage = onDatachannelMessage;

  } catch (e) {
    console.log(e);
  }
});

socket.on("offer_send", async function (offer) {
  try {

    console.log("I receive the offer & channel");
    await myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    await myPeerConnection.setLocalDescription(answer);

    myPeerConnection.addEventListener("datachannel", (event) => {
      dataChannel = event.channel;
      dataChannel.onmessage = onDatachannelMessage;
    })


    socket.emit("answer", answer, roomName.value);
  } catch (e) {
    console.log(e);
  }
});

socket.on("answer_send", async function (answer) {
  try {
    console.log("I got the answer");
    await myPeerConnection.setRemoteDescription(answer);
  } catch (e) {
    console.log(e);
  }
});

socket.on("ice_send", async function (candidate) {
  try {
    console.log("Got ice candidate")
    await myPeerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.log(e);
  }
});

// Socket codes
async function checkNicknames(nicknames) {
  if (nicknames.findIndex((nick) => nick === nickname.value) !== -1) {
    enterRoomMessage.innerText = "이미 존재하는 닉네임입니다.";
    return;
  }
  socket.emit("check_room", roomName.value, checkRoom);
}

async function checkRoom(result) {
  if(result) {
    try {
      await getMedia();
      makeConnection();
    } catch (e) {
      console.log(e);
    }
    socket.emit("enter_room", roomName.value, nickname.value, afterEnterRoom);
  } else {
    enterRoomMessage.innerText = "이미 채팅 중인 방입니다."
  }
}

async function afterEnterRoom(allNicknames) {
  formEnterRoom.classList.add("hidden");
  container.classList.remove("hidden");
  addMessage("방에 참가했습니다.", ["font-bold"]);
  headerTitle.innerText = `Welcome to ${roomName.value}, ${nickname.value}!`

  if(allNicknames && allNicknames.length > 0) {
    const peerNick = allNicknames[0];
    addMessage(`${peerNick}님과 연결되었습니다.`);
  }
  chatForm.querySelector("input").focus();
}

// rtc codes
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
        ]
      }
    ]
  });
  myPeerConnection.addEventListener("icecandidate", handlerIce);
  myPeerConnection.addEventListener("addstream", handlerAddStream);
  console.log(myStream);
  myStream.getTracks().forEach(
      track => myPeerConnection.addTrack(track, myStream)
  );
}
function handlerIce(data) {
  socket.emit("ice", data.candidate, roomName.value);
}

function handlerAddStream(data) {
  peerStream = data.stream;
  peerFace.srcObject = peerStream;
  peerFace.play();
}

function onDatachannelMessage(event) {
  const data = JSON.parse(event.data);
  const {from, message} = data;
  addMessage(`${from} : ${message}`);
}