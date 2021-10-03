const messageList = document.querySelector("#message-list");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const nicknameInput = document.querySelector("#nickname-input");
const nicknameForm = document.querySelector("#nickname-form");
const nicknameLabel = document.querySelector("#nickname-label");
const joinedList = document.querySelector("#participants");

const socket = new WebSocket(`ws://${window.location.hostname}:3000`);
let nickname = `DefaultNick-${Math.ceil(Math.random() * 1000)}`;
let participants = [];

socket.addEventListener("open", () => {
  const message = {
    type: "open",
    payload: null,
    from: nickname,
  };
  console.log("Connected to server ✅");
  socket.send(JSON.stringify(message));
});

socket.addEventListener("message", (message) => {
  const decoded = JSON.parse(message.data);
  let msg = "";

  console.log(decoded);

  switch (decoded.type) {
    case "chat":
      msg = `${decoded.from}: ${decoded.payload}`;
      break;
    case "open":
    case "nick":
    case "close":
      msg = decoded.payload.message;
      participants = decoded.payload.list.slice(0);
      rerenderJoined();
      break;
    default:
      break;
  }

  if (msg !== "") {
    const liItem = document.createElement("li");
    liItem.innerText = msg;
    messageList.appendChild(liItem);
  }
});

socket.addEventListener("close", () => {
  const message = {
    type: "close",
    payload: null,
    from: nickname,
  };
  console.log("Disconnted to server ❌");
  socket.send(JSON.stringify(message));
});

setTimeout(() => {
  const message = {
    from: nickname,
    type: "chat",
    payload: "Hello from the browser",
  };
  socket.send(JSON.stringify(message));
}, 10000);

window.addEventListener("load", () => {
  nicknameLabel.innerText = "Nickname: " + nickname;
});

messageForm.addEventListener("submit", (event) => {
  const message = {
    type: "chat",
    payload: messageInput.value,
    from: nickname,
  };

  event.preventDefault();
  socket.send(JSON.stringify(message));
  messageInput.value = "";
});

nicknameForm.addEventListener("submit", (event) => {
  event.preventDefault();
  oldNickname = nickname.slice(0);
  nicknameLabel.innerText = "Nickname: " + nicknameInput.value;
  nickname = nicknameInput.value;
  const message = {
    type: "nick",
    payload: nicknameInput.value,
    from: oldNickname,
  };

  socket.send(JSON.stringify(message));
});

function rerenderJoined() {
  joinedList.innerHTML = "";
  participants.map((p) => {
    const li = document.createElement("li");
    li.innerText = p;
    joinedList.append(li);
  });
}
