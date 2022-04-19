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

let listPlayer = new Array
let Id = '';

let roominfo = {Id, listPlayer}

io.on('connection', (socket) => {
  
   console.log(socket.id + ' connected');

  //  socket.on('newGameCreated',(data)=>{
  //    console.log(data.gameId);
  //     listPlayer.push(data.mySocketId) 
  //     socket.join((data.gameId).toString())
     
  //     io.sockets.to(data.gameId.toString()).emit('connectToRoom', "You are in room no. "+data.gameId);
     
      
  //   })

   socket.on('joinRoom',(roomId)=>{
    console.log(roomId);
    Id = roomId.toString()
    socket.join((roomId).toString())
    console.log('joined');
   // socket.emit('joined')
    socket.to(roomId.toString()).emit('inroom', "new"+ roomId);
   //list player trong 1 room
    socket.emit("play",listPlayer)
    
    
    listPlayer.push(socket.id) 
  //thông báo có player mới vào
    socket.to(roomId.toString()).emit('newPlayer',{socketId: socket.id});
  
  })
  

  // lấy những player đã ở trong game + toạ độ

    // lắng nghe tạo độ di chuyển và thông báo lại cho các broadcast theo dõi khác trong map
   
   
    socket.on('move', ({ x, y }) => {
    console.log({x,y,playerId: socket.id});
    socket.to(Id).emit('move', { x, y,playerId: socket.id});
  });
    socket.on('moveEnd', () => {
    socket.to(Id).emit('moveEnd',{playerId : socket.id});
  });   
  socket.on('disconnect', () => {
      console.log(socket.id + ' disconnected');
      listPlayer = listPlayer.filter(x=>x!==socket.id)
    });
  }); 
  