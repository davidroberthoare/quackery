// server.js
// where your node app starts

const http = require("http");
// const https = require("https"),
//   fs = require("fs");

// const options = {
//   key: fs.readFileSync("/etc/letsencrypt/live/perquackey.davidhoare.net/privkey.pem"),
//   cert: fs.readFileSync("/etc/letsencrypt/live/perquackey.davidhoare.net/fullchain.pem")
// };

const express = require("express");
const app = express();
const colyseus = require("colyseus");

const gameRoom = require("./rooms/gameRoom"); // basic starter code

// make all the files in 'public' available
app.use(express.static("public"));

// const server = https.createServer(options, app);
const server = http.createServer(app);
const gameServer = new colyseus.Server({
    server,
});

gameServer
    .define('mygame', gameRoom.myGameRoom, { maxPlayers: 8 })
    .filterBy(['session'])


process.env.PORT = "3100"
gameServer.listen(process.env.PORT);
console.log('Listening on port:' + process.env.PORT);

