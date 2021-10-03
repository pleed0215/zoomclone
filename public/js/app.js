const myFace = document.getElementById("my-face");

const socket = io();

let myStream = null;

async function getMedia() {

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            {
                audio: true,
                video: true,
            }
        );
        /* 스트림 사용 */
        myFace.srcObject = myStream;
        myFace.onloadedmetadata = function(e) {
            myFace.volume = 0.1;
            myFace.play();
        }

    } catch(err) {
        alert(err);
    }
}

window.addEventListener("load", function(event) {
   getMedia();

});