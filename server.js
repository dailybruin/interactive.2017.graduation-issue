const logger = require('morgan');
const express = require('express');
const redis = require('redis');

const PORT = process.env.PORT || process.argv[2] || 3030;
const PROD = process.env.PRODUCTION;

let app = express();

app.use(logger('dev'));

if(!PROD) {
  //enable CORS when in development
  //will be using a reverse proxy or something in prod
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
}

app.post('/add', (req,res) => {
  res.send("bla");
});

app.listen( PORT , '0.0.0.0', () => {
  console.log("Server started on port %d.", PORT);
});
