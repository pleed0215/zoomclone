import http from "http";
import express from "express";
import WebSocket from "ws";
import { decode } from "querystring";

const app = express();

app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const sockets: WebSocket[] = [];
let participants: string[] = [];

wss.on("connection", (socket) => {
  sockets.push(socket);
  socket.on("close", (message) => {
    const index = sockets.findIndex((s) => s === socket);
    if (index !== -1) {
      sockets.splice(index);
    }
    console.log("Disconnected from client");
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

httpServer.listen(3000, () => {
  console.info("🐶 Http & Ws start at port 3000");
});
