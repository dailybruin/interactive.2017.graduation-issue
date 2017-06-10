const logger = require('morgan');
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const apicache = require('apicache');
const shortid = require('shortid');
const fileUpload = require('express-fileupload');
const nunjucks = require('nunjucks');
var GoogleSpreadsheet = require('google-spreadsheet');

const PORT = process.env.PORT || process.argv[2] || 3030;
const DB = process.env.DB || 'grad-issue-2017';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PW = process.env.DB_PW || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const PROD = process.env.PRODUCTION;

const GOOGLE_SHEETS_KEY = process.env.GSKEY;
const GOOGLE_SHEETS_EMAIL = process.env.GSEMAIL;
const GOOGLE_SHEETS_PRIVKEY = process.env.GSPKEY;

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

/* Google Sheets config */
const GoogleDoc = new GoogleSpreadsheet(GOOGLE_SHEETS_KEY);
let GoogleSheet = null;

const creds = {
  client_email: GOOGLE_SHEETS_EMAIL,
  private_key: GOOGLE_SHEETS_PRIVKEY,
}

console.log(creds);

GoogleDoc.useServiceAccountAuth(creds, (done) => {
  console.log("Getting service account auth...");
  /*
  GoogleDoc.getInfo((err, info) => {
    if(err) {
      console.log('Google Auth Failed!', err);
      process.exit(1);
    }
    console.log('Loaded doc: ' + info.title + ' by '+ info.author.email);
    GoogleSheet = info.worksheets[0];
  });*/
});

let app = express();
let cache = apicache.middleware;

app.use(logger('dev'));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

nunjucks.configure('source/templates', {
  autoescape: true,
  express: app,
  watch: !PROD,
});

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
  req.apicacheGroup = 'entries';
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
    apicache.clear('entries');
    res.send('Done');
  })
});

app.get('/clearcache', (req, res) => {
  // Wow much secure
  if(req.query.key === "bruin111") {
    apicache.clear();
    res.send("Cache cleared");
  } else {
    res.send("Go away.")
  }
});

app.get('/upload', (req, res) => {
  // Wow much secure
  if(req.query.key === "bruin111") {
    res.render("upload.html");
  } else {
    res.send("Go away.")
  }
});

app.post('/upload', (req, res) => {
  if(req.body.key !== "bruin111") {
    return res.send("Go away.");
  }

  if(!req.files.img) {
    return res.send("No files provided.");
  }

  const file = req.files.img;
  const fileName = `${shortid.generate()}-${file.name}`;

  file.mv(`./uploads/${fileName}`, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    return res.send(`<p>Your file (PASTE THIS LINK TO THE GOOGLE DOC)</p>
                    <pre>/img-content/${fileName}</pre>
                    <img width="400" src="/img-content/${fileName}">`);
  });
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

app.get('/', cache('1 hour'), (req, res) => {
  if(!GoogleSheet) {
    GoogleDoc.getInfo((err, info) => {
      if(err) {
        console.log('Google Auth Failed!', err);
        res.send("Something went wrong :(");
        process.exit(1);
        return;
      }
      console.log('Loaded doc: ' + info.title + ' by '+ info.author.email);
      GoogleSheet = info.worksheets[0];
    });
    return res.send("Server restarting hang tight...");
  }

  GoogleSheet.getRows({
    offset: 1,
    orderby: 'section'
  }, (err, rows) => {
    if(err) {
      console.log(err);
      return res.status(500).send("Server Error");
    } else {
      let final = rows.reduce((acc, row) => {
        if(acc.sections.hasOwnProperty(row.section)) {
          acc.sections[row.section].articles.push(row);
        } else {
          acc.sections[row.section] = {
            header: row.section,
            articles: [row]
          }
        }
        return acc;
      }, { sections: {} });
      res.render("index.nunjucks", final);
    }
  });
});

app.use(express.static('build'));
app.use('/img-content', express.static('uploads'));

app.listen( PORT , '0.0.0.0', () => {
  console.log("Server started on port %d.", PORT);
});
