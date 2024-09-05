import cookieParser from 'cookie-parser';
import express from 'express';
import createError from 'http-errors';
import logger from 'morgan';
import path from 'path';

import debug from 'debug';
import indexRouter from './routes/index.js';
import routineRouter from './routes/routines.js';
import statisticsRouter from './routes/statistics.js';
import usersRouter from './routes/users.js';

const errorLog = debug('app:error');

const app = express();

// view engine setup
app.set('views', path.join(path.resolve(), 'views')); // __dirname 대신 path.resolve() 사용
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/routines', routineRouter);
app.use('/statistics', statisticsRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  errorLog(`Error occurred: ${err.message}`);

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

export default app;
