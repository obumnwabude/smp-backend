const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/smp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Successfully connected to MongoDB!');
  })
  .catch((error) => {
    console.log('Unable to connect to MongoDB!');
    console.error(error);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('[:date[clf]] :method :url   :status  :response-time ms'));

app.use('/', (req, res) => res.send('OK'));

module.exports = app.listen(port);
