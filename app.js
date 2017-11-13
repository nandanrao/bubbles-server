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

function getRooms(socket) {
  return Object
    .keys(socket.rooms)
    .filter(k => k !== socket.id)
}


io.sockets
  .on('connection', socketioJwt.authorize({
    secret: pem,
    timeout: 15000,// 15 seconds to send the authentication message,
    algorithm: 'RS256',
    callback: false
  }))
  .on('authenticated', function(socket) {
    const email = socket.decoded_token.email;
    console.log('connected: ' + email);

    setInterval(() => {
      console.log('rooms: ', getRooms(socket))
    }, 5000)

    socket
      .on('disconnect', () => {
        console.log('disconnect', email)
      })
      .on('SUBMIT_ORDER', payload => {
        console.log(socket.id)
        // socket.emit('SUBMIT_ORDER', payload);
        socket.to('foo').emit('SUBMIT_ORDER', payload);
        console.log('SUBMIT_ORDER', payload)
      })
      .on('JOIN_WAITING_ROOM', game => {
        socket.join('waiting-room');
      })
      .on('JOIN_GAME', game => {
        socket.join(game).leave('waiting-room');
      })
  })

// var _ = require('lodash')
// setInterval(() => console.log('sockets: ', _.map(io.sockets.connected, c => c.rooms)), 2000)

// when we have enough active users -- get their emails > 6
// users.assignGames(db, emails);
// emit NEW_GAMES event to waiting room
setTimeout(() => io.to('waiting-room').emit('NEW_GAMES'), 10000)

// when they join, add them to their user in db

app.use(morgan('tiny'));
app.use(cors());
app.use(bodyParser.json());
app.use(jwt({ secret: pem }));

app.get('/user', (req, res) => {
  db.collection('users')
    .findOne({ email: req.user.email })
    .then(user => {
      if (user) return res.json(user)
      console.log('user get!!!!')
      users
        .createUser(db, req.user)
        .then(user => res.json(user))
    });
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});
