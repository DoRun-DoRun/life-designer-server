import cookieParser from 'cookie-parser';
import express from 'express';
import createError from 'http-errors';
import logger from 'morgan';
import path from 'path';

import indexRouter from './routes/index.js';
import routinRouter from './routes/routines.js';
import usersRouter from './routes/users.js';

const app = express();

// view engine setup
app.set('views', path.join(path.resolve(), 'views')); // __dirname 대신 path.resolve() 사용
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public'))); // __dirname 대신 path.resolve() 사용

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/routins', routinRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;