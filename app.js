import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';



//socketio
import  http from 'http';
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server)

import indexRouter from './routes/index.js';
import auth from './routes/auth.js'

var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(express.static(path.join(__dirname, 'public')));




//router
app.use('/', indexRouter);
app.use('/auth',auth);


//socketio call
io.on('connection', (socket) => {
  console.log('a user connected');
});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 3000);
  res.render('error');
});

app.listen(3000, () => {
  console.log('listening on *:3000');
});


