const express = require('express');
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

const patientRouter = require('./routes/patientRoutes');
const menuRouter = require('./routes/menuRoutes');
const unitRouter = require('./routes/unitRoutes');
const userRouter = require('./routes/userRoutes');

const { protect } = require('./controllers/authController');
// const globalErrorHandler = require('./controllers/errorController');

const app = express();

// MIDDLEWARES
app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//allow 100 requests from the same address per hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});

//if your frontend is located somewhere different than your API, you'd need to allow it in cors
// could also pass other urls here for specific websites to have access
app.use(cors({ origin: 'http://localhost:3000' }));

//ALLOWING PATCH AND DELETE REQUESTS WITH CORS
//allows these on all resources
app.options('*', cors());

//add limiter to ALL routes that start with /api
app.use('/api', limiter);

// Prevent a req body from being accepted if it is over 10kb in size
app.use(express.json({ limit: '10kb' }));

// DATA SANITIZATION against NoSql injection
app.use(mongoSanitize());

// DATA SANITIZATION against XSS
app.use(xss());

// Serving static files
app.use(express.static(`${__dirname}/public/`));

app.use((req, res, next) => {
  next();
});

// ADD PARAMETERS TO WHITELIST AS NEEDED
app.use(hpp({ whitelist: [] }));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.requestTime);
  next();
});

//MIDDLEWARE ROUTERS

//ALL routes are protected routes EXCEPT for user log in & register
app.use('/api/v1/patients', protect, patientRouter);
app.use('/api/v1/menus', protect, menuRouter);
app.use('/api/v1/units', protect, unitRouter);
app.use('/api/v1/users', userRouter);

// WILL ONLY BE RUN IF A ROUTE IS REQUESTED THAT NO ABOVE ROUTER HANDLES
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server`,
  });
});

// app.use(globalErrorHandler);

module.exports = app;
