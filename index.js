require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser')
const dns = require('dns')
const url = require('url')
const cors = require('cors');
const { hostname } = require('os');
const app = express();

// database
class Db {
  constructor() {
    this.data = []
  }

  getElementByOrignalUrl(original_url) {
    for (let dbIndex = 0; dbIndex < this.data.length; dbIndex++) {
      // if element exists => return element
      if (this.data[dbIndex].original_url == original_url) {
        return this.data[dbIndex]
      }
    }
    // if element does not exists => return false
    return false
  }

  getElementByShortUrl(short_url) {
    for (let dbIndex = 0; dbIndex < this.data.length; dbIndex++) {
      // if element exists => return element
      if (this.data[dbIndex].short_url == short_url) {
        return this.data[dbIndex]
      }
    }
    // if element does not exists => return false
    return false
  }

  // check if url already exists in db
  doesElementExist(original_url) {
    // if database is empty => return false
    if (db.data.length === 0) {
      console.log(`New database request for: "${original_url}"`)
      return false
    }
    // if database is not empty => search for url
    else {
      // check each database entry
      for (let dbIndex = 0; dbIndex < this.data.length; dbIndex++) {
        // if element already exists => return true
        if (this.data[dbIndex].original_url == original_url) {
          return true
        }
      }
      // if no element was found in database => return false
      console.log(`New database request for: "${original_url}"`)
      return false
    }
  }

  // return new short url
  getNewShortUrl() {
    // if database is empty => return 1 as new short url
    if (db.data.length === 0) {
      return 1
    }
    // if database is not empty => search for new short url
    else {
      // try out different short_urls
      let foundNewShortUrl = false
      for (let new_short_url = 1; new_short_url <= db.data.length + 1; new_short_url++) {
        // check each database for new short url
        for (let dbIndex = 0; dbIndex < this.data.length; dbIndex++) {
          // new short_url already exists in database => start again with new url
          if (this.data[dbIndex].short_url === new_short_url) {
            foundNewShortUrl = false
            break;
          }
          // new short_url doesnt exist in database => indicate result
          else {
            foundNewShortUrl = true
          }
        }
        // if new short_url is found => return new short_url
        if (foundNewShortUrl) {
          return new_short_url
        }
      }
    }
  }
}
class DbEntry {
  constructor(original_url, short_url) {
    this.original_url = original_url
    this.short_url = short_url
  }
}

// Create local Database
const db = new Db
console.log(`Created new local Database: ${JSON.stringify(db)}`)


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

const URL_ENCODED_PARSER = bodyParser.urlencoded({ extended: false })

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// url form endoint
app.post('/api/shorturl', URL_ENCODED_PARSER, function (req, res) {
  // Extract data from API request 
  const URL = req.body.url
  const URL_OBJ = url.parse(URL);
  const HOSTNAME = URL_OBJ.hostname

  // check url validation
  dns.lookup(HOSTNAME, (error, address, family) => {
    // if url is valid => continue
    if (!error) {
      const URL_HREF = URL_OBJ.href
      // if element is new => save in db and generate new short_url
      if (!db.doesElementExist(URL_HREF)) {
        // generate new short url
        const NEW_SHORT_URL = db.getNewShortUrl()
        // build db entry
        const newDbEntry = new DbEntry(URL_HREF, NEW_SHORT_URL)
        console.log(`Created new datbase entry: ${JSON.stringify(newDbEntry)}`)
        db.data.push(newDbEntry)

        // respond with new db entry
        res.send({
          original_url: URL_HREF,
          short_url: NEW_SHORT_URL,
        })
      }
      // if element is not new => send existing element from local database
      else {
        const DB_ELEMENT = db.getElementByOrignalUrl(URL_HREF)
        console.log(`Found existing datbase entry: ${JSON.stringify(DB_ELEMENT)}`)

        // respond with  db entry
        res.send({
          original_url: DB_ELEMENT.original_url,
          short_url: DB_ELEMENT.short_url
        })
      }
    }
    // if url is not valid => respond with error
    else {
      res.send({
        error: 'invalid url'
      })
    }
  });
})


// URL Redirection Endpoint
app.get('/api/shorturl/:short_url', function (req, res) {
  // Extract data from API request
  const SHORT_URL = req.params.short_url
  const SHORT_URL_NUMBER = Number(SHORT_URL)

  // if req param :short_url is a valid number => search for Element in database
  if (SHORT_URL_NUMBER) {
    const REDIRECT_TO = db.getElementByShortUrl(SHORT_URL_NUMBER).original_url
    // if :short_url exists in database => redirect to original_url
    if (REDIRECT_TO) {
      console.log("Redirected to ", REDIRECT_TO)
      res.redirect(REDIRECT_TO)
    }
    // if :short_url does not exist in database => send feedback
    else {
      res.send({
        error: 'short_url does not match any database entry.'
      })
    }
  }
  // if req param :short_url is not a valid number => respond with error
  else {
    res.send({
      error: 'invalid url'
    })
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
