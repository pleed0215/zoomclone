import express from "express";

const app = express();
app.set("view engine", "pug");
app.set("views", process.cwd() + "/src/views");
app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});
