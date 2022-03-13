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
  
  const PORT = process.env.PORT || '4000';
  const NODE_ENV = process.env.NODE_ENV;
  
  httpServer.listen(PORT, function () {
    if (NODE_ENV === 'develop')
      console.log(`Server is listening at http://localhost:${PORT}`);
  });