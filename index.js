const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const { connection } = require("./configs/db");
const { userRouter } = require("./route/user");
const io = new Server(server);
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { UserModel } = require("./model/userModel");

let liveusers = []

app.use(express.json())
app.use(express.static('view'))

app.get("/", async(req, res)=>{
    res.sendFile(__dirname + '/view/index.html');
});

app.use("/api", userRouter)

io.on("connection", (socket)=>{
    console.log("user connected");
    socket.on("live", (data)=>{
        socket.email = data.email
        socket.token = data.token
        liveusers.push(data.email);
        socket.broadcast.emit("data", liveusers)
    })

    socket.on("disconnect", ()=>{
        liveusers = liveusers.filter((el)=>{
            return el != socket.email
        })
        socket.broadcast.emit("data", liveusers)
    });
    socket.on("logout", ()=>{
        liveusers = liveusers.filter((el)=>{
            return el != socket.email
        })
        socket.emit("out", true)
        socket.broadcast.emit("data", liveusers)
        socket.disconnect();
    });
    jwt.verify(socket.token, process.env.SECRET, async(err, decoded)=> {
        if (err){
            socket.emit("notlogged", true)
        }else{
            let explorefnds = await UserModel.find();
            console.log(explorefnds)
            socket.emit("liveuserdata", {"data": explorefnds, "live": liveusers})
        }
    });
    
});

server.listen(process.env.PORT, async()=>{
    try {
        await connection;
        console.log("connected to db")
    } catch (error) {
        console.log(error)
    }
    console.log("server is running")
})