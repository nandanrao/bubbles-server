var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var socketioJwt   = require("socketio-jwt");
var jwt = require('jsonwebtoken');

var jwt = require('express-jwt');
var fs = require('fs');
var cors = require('cors');
var bodyParser = require('body-parser');

var morgan = require('morgan');
var axios = require('axios');
var users = require('./lib/users');

// function certToPEM(cert) {
//    cert = cert.match(/.{1,64}/g).join('\n');
//    cert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`;
//    return cert;
// }

// axios
//   .get('https://nandan.auth0.com/.well-known/jwks.json')
//   .then(res => res.data.keys[0].x5c[0])
//   .then(certToPEM)
//   .then(secret => {
    // fs.writeFileSync('pem', secret);
// })

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/bubbles';
let db;
MongoClient
  .connect(url)
  .then(_db => db = _db)

const pem = fs.readFileSync('pem');

// DEAL WITH MULTIPLE PAGES OPEN FOR ONE USER/BROWSER!!

io.sockets
    .on('connection', socketioJwt.authorize({
      secret: pem,
      timeout: 15000,// 15 seconds to send the authentication message,
      algorithm: 'RS256',
      callback: false
    }))
    .on('authenticated', function(socket) {
      const email = socket.decoded_token.email;
      console.log('hello! ' + email);
      users.connect(db, email)
        .then(() => users.assignRoom(db, 6))
        .then(u => {

        })

      // find games if games!!!
      // then join room

      socket.on('disconnect', () => {
        console.log('disconnect', email)
        users.disconnect(db, email);
      })
    });

app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json());
app.use(jwt({ secret: pem }));

app.get('/user', (req, res) => {
  db.collection('users')
    .findOne({ email: req.user.email })
    .then(user => {
      if (user) return res.json(user)
      users
        .createUser(db, req.user)
        .then(user => res.json(user))
    });
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});
