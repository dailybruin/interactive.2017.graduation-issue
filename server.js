const logger = require('morgan');
const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const Sequelize = require('sequelize');
const apicache = require('apicache');

const PORT = process.env.PORT || process.argv[2] || 3030;
const DB = process.env.DB || 'grad-issue-2017';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PW = process.env.DB_PW || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const PROD = process.env.PRODUCTION;

const DB_URL = process.env.DATABASE_URL || null;

let sequelize = null;

/* DATABASE CONFIG */
if (DB_URL) {
  sequelize = new Sequelize(DB_URL, {
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
  });
} else {
  sequelize = new Sequelize(DB, DB_USER, DB_PW, {
    host: DB_HOST,
    dialect: 'postgres',

    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
  });
}

sequelize
  .authenticate()
  .then(() => {
    console.log('Connected to the database!');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    process.exit(1);
  });

const Entry = sequelize.define('entry', {
  fromloc: {
    type: Sequelize.STRING
  },
  toloc: {
    type: Sequelize.STRING
  },
  degree: {
    type: Sequelize.STRING,
    validate: {
      len: [2,4]
    }
  },
  major: {
    type: Sequelize.STRING
  },
  next: {
    type: Sequelize.STRING
  },
  years: {
    type: Sequelize.INTEGER,
    validate: {
      isInt: true,
      max: 9,
      min: 1
    }
  },
  from: {
    type: Sequelize.JSON
  },
  to: {
    type: Sequelize.JSON
  }
});

sequelize.sync();

let app = express();
let cache = apicache.middleware;

app.use(logger('dev'));
app.use(express.static('build'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (!PROD) {
  // enable CORS when in development
  // will be using a reverse proxy or something in prod
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
}

app.get('/entries', cache('5 minutes'), (req, res) => {
  Entry.findAll({
    limit: 40,
    order: [['id', 'DESC']],
  }).then((entries) => {
    res.json(entries);
  });
});

app.post('/entries', (req, res) => {
  Entry.create(req.body)
  .then(() => {
    apicache.clear();
    res.send('Done');
  })
});

// Remove in Prod maybe?
app.get('/reset', (req, res) => {
  if (req.query.key === "bruin111") {
    console.log("DESTROYING TABLE");
    apicache.clear();
    Entry.destroy({
      where: {},
      truncate: true,
    })
    .then(() => {
      res.send("Deleted all entries");
    });
  } else {
    res.send("Go away.");
  }
});

app.listen( PORT , '0.0.0.0', () => {
  console.log("Server started on port %d.", PORT);
});
