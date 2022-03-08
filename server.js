const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('DB connection successful'));

//START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port: ${port}...`);
});

//heroku will send a signal called SIGTERM every 24 hours to restart the app. This will react to that signal and gracfully shut down
process.on('SIGTERM', () => {
  console.log('👍 SIGTERM RECIEVED. Shutting down gracefully');
  server.close(() => {
    console.log('👍 Process terminated');
  });
});
