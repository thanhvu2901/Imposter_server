// Configuration
import dotenv from 'dotenv';
dotenv.config();

// ---------------------------------------------------------------------- //

import { createServer } from 'http';
import { Server } from 'socket.io';

//httpServer.listen(40567);

// ---------------------------------------------------------------------- //
// Express
import express, { ErrorRequestHandler } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());


app.use(function (req, res, next) {
    res.status(404).json({
      error: 'Endpoint not found',
    });
  });
  
  app.use(function (err, req, res, next) {
    if (NODE_ENV === 'develop') console.log(err.stack);
  
    res.status(500).json({
      error: 'Something broke!',
    });
  } as ErrorRequestHandler);
  
  const PORT = process.env.PORT || '3000';
  const NODE_ENV = process.env.NODE_ENV;
  
  httpServer.listen(PORT, function () {
    if (NODE_ENV === 'develop')
      console.log(`Server is listening at http://localhost:${PORT}`);
  });

  //open socket
let newPlayer;
let listPlayer = new Array
let item = 0;

io.on('connection', (socket) => {
  
     
 
   console.log(socket.id + ' connected');
  listPlayer.push(socket.id) 
    console.log(listPlayer);

 //   socket.broadcast.emit('playerId',{playerId : socket.id});
  // lưu lại Id những player đã ở trong va emit 
  
  
  socket.emit("play", 'hello')
  
  console.log('after');
//   
//  socket.broadcast.emit('otherPlayer',{listPlayer : listPlayer});
  

  

 

    // lắng nghe tạo độ di chuyển và thông báo lại cho các broadcast theo dõi khác trong map
   socket.on('move', ({ x, y }) => {
    console.log({x,y,playerId: socket.id});
    socket.broadcast.emit('move', { x, y,playerId: socket.id});
  });
    socket.on('moveEnd', () => {
    socket.broadcast.emit('moveEnd',{playerId : socket.id});
  }); 
  
  socket.on('disconnect', () => {
      console.log(socket.id + ' disconnected');
      listPlayer = listPlayer.filter(x=>x!==socket.id)

    });
  }); 
  