const myFace = document.getElementById("my-face");
const btnMute= document.getElementById("my-face__mute");
const btnToggleCamera = document.getElementById("my-face__toggle-camera")
const selectCamera = document.getElementById("my-face__select-camera");
const roomConnectContainer = document.getElementById("room-container");
const roomForm = document.getElementById("room-container__form");
const callContainer = document.getElementById("call-container");


let isMute = false;
let prevVolume = 0.1;
let isCameraOff = false;


const socket = io();

let myStream = null;

function startMedia() {
    roomConnectContainer.hidden = false;
    callContainer.hidden = true;
}

function onClickMute() {
    let innerText = isMute ? "Unmute" : "Mute";
    isMute = !isMute;
    myStream.getAudioTracks().forEach( track => track.enabled = isMute);

    btnMute.innerText = innerText;
}

function onClickToggleCmaera() {
    let innerText = !isCameraOff ? "Turn camera on" : "Turn camera off";
    isCameraOff = !isCameraOff;
    myStream.getVideoTracks().forEach(track => track.enabled = !isCameraOff);
    btnToggleCamera.innerText = innerText;

}

async function getCameras() {
    try {
        let infos = await navigator.mediaDevices.enumerateDevices();
        let cameras = infos.filter(device => device.kind === "videoinput");
        return cameras;
    }catch (e) {
        console.log(e);
    }
}

async function setCameraSelect() {
    try {
        let cameras = await getCameras();
        selectCamera.innerHTML = null;

        const option = document.createElement("option");
        option.innerText = cameras.length > 0 ? "Select Camera": "No Camera available";
        option.disabled = true;
        selectCamera.append(option);

        if(cameras.length > 0) {
            cameras.forEach(
                (camera, index) => {
                    const option = document.createElement("option");
                    const currentCamera = myStream?.getVideoTracks()[0];
                    option.value = camera.deviceId;
                    option.label = camera.label;
                    if(currentCamera) {
                        option.selected = currentCamera?.label === camera.label;
                    } else {
                        option.selected = index === 0;
                    }
                    selectCamera.append(option);
                }
            )
        }
    } catch(e) {
        console.log(e);
    }
}

async function updateStream(deviceId) {
    if(deviceId) {
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
        if(cameras.length > 0) {
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

async function getMedia() {
    try {
        await setCameraSelect();
        /* 스트림 사용 */
        await updateStream();
        myFace.onloadedmetadata = function(e) {
            myFace.volume = prevVolume;
            myFace.play();
        }
    } catch(err) {
        alert(err);
    }
}

window.addEventListener("load", async function(event) {
    try {
        startMedia();
        //await getMedia();
    } catch (e) {
        console.log(e);
    }
});

btnMute.addEventListener("click", onClickMute);
btnToggleCamera.addEventListener("click", onClickToggleCmaera);
navigator.mediaDevices.addEventListener("devicechange", async () => {
    await setCameraSelect();
    await updateStream();
})
selectCamera.addEventListener("change", async function (event) {
    await updateStream(event.target.value);
})

