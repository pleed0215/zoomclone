import http from "http";
import express from "express";
import SocketIO, { Socket} from "socket.io"

const app = express();

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const io = new SocketIO.Server(httpServer);

interface ExtendedSocket extends Socket {
  nickname?: string;
}

const countRoom = ():number => {
  const {sids, rooms} = io.sockets.adapter;
  let count = 0;
  rooms.forEach((_, key) => sids.get(key) !== undefined && count++);
  return count;
}

io.on("connection", (socket)=> {
  const extended = <ExtendedSocket>socket;
  extended["nickname"] = "Anon";

  socket.onAny(() => {

  });

  socket.on("enter_room", (roomName, nick, done) => {
    if(roomName !== null || roomName !== "") {
      socket.join(roomName);
      done(nick);
      console.log(countRoom());
      socket.to(roomName).emit("joined", nick);
    }
  });

  socket.on("send_message", (roomName, nickname, msg, done) => {
    if(roomName && msg) {
      socket.to(roomName).emit('receive', nickname, msg)
      done(msg);
    }
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach( room => socket.to(room).emit("receive", "Disconnecting", `${socket.id} left`));
  })
})

/*
wss.on("connection", (socket) => {
  sockets.push(socket);
  socket.on("close", (message) => {
    const index = sockets.findIndex((s) => s === socket);
    if (index !== -1) {
      sockets.splice(index);
      console.log("Disconnected from client");
    }
  });
  socket.on("message", (message) => {
    const decoded = JSON.parse(message.toString());

    if (decoded.type === "message") {
      const message = {
        from: "server",
        type: "info",
        payload: `Message from ${decoded.from}: "${decoded.payload}"`,
      };
      sockets.forEach((s) => s.send(JSON.stringify(message)));
    } else if (decoded.type === "nick") {
      participants = participants.filter((p) => p !== decoded.from);
      participants.push(decoded.payload);
      const message = {
        from: "server",
        type: "nick",
        payload: {
          message: `Changed nickname from ${decoded.from} to: ${decoded.payload}`,
          list: [...participants],
        },
      };
      sockets.forEach((s) => s.send(JSON.stringify(message)));
    } else if (decoded.type === "open") {
      participants.push(decoded.from);
      const message = {
        from: "server",
        type: "open",
        payload: {
          message: `${decoded.from} joined chat`,
          list: [...participants],
        },
      };
      sockets.forEach((s) => s.send(JSON.stringify(message)));
    } else if (decoded.type === "close") {
      participants = participants.filter((p) => p !== decoded.from);
      const message = {
        from: "server",
        type: "close",
        payload: {
          message: `${decoded.from} leaved chat`,
          list: [...participants],
        },
      };
      sockets.forEach((s) => s.send(JSON.stringify(message)));
    } else if (decoded.type === "chat") {
      const message = {
        from: decoded.from,
        type: "chat",
        payload: decoded.payload,
      };
      sockets.forEach((s) => s.send(JSON.stringify(message)));
    }
  });
});
*/

httpServer.listen(3000, () => {
  console.info("🐶 Http & Ws start at port 3000");
});


