const path = require("path");
const express = require("express");
const morgan = require("morgan");

const PORT = process.env.PORT || 3000;
const app = express();
//const socketio = require("socket.io");
var cors = require('cors');
const { createServer } = require("http");
const { Server } = require('socket.io')
//const socketio = require("socket.io");
const { posix } = require("path");



const createApp = () => {
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: false }));
  //app.use(cookieParser());

  const NODE_ENV = process.env.NODE_ENV


  app.use(function (req, res, next) {
    res.status(404).json({
      error: 'Endpoint not found',
    });
  });
}
const startListening = () => {
  // start listening (and create a 'server' object representing our server)

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });
  httpServer.listen(PORT, () =>
    console.log(`Mixing it up on port ${PORT}`)
  );
  //const io = socketio(server);
  require("./socket")(io);
};

async function bootApp() {
  await createApp();
  await startListening();
}

bootApp();


//open socket

let listPlayer = new Array
let Id = '';
let posX, posY



