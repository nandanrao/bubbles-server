var socketioJwt   = require("socketio-jwt");

var jwt = require('express-jwt');
var fs = require('fs');
var cors = require('cors');
var bodyParser = require('body-parser');

var morgan = require('morgan');
var axios = require('axios');
var users = require('./lib/users');
var games = require('./lib/games');
var connections = require('./lib/connections');
var _ = require('lodash')
var mongo = require('mongodb');
var MongoClient = mongo.MongoClient;


var mongoHost = process.env.MONGO_HOST || 'localhost:27017/bubbles';
var mongoUser = process.env.MONGO_USER;
var mongoPass = process.env.MONGO_PASS;

var url;

if (mongoUser) {
  url = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}`;
} else {
  url = `mongodb://${mongoHost}`
}


let db;
MongoClient
  .connect(url)
  .then(_db => db = _db)

const pem = fs.readFileSync('pem');

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.sockets
  .on('connection', socketioJwt.authorize({
    secret: pem,
    timeout: 240000, // 15 seconds to send the authentication message,
    algorithm: 'RS256',
    ignoreExpiration: false,
  }))
  .on('authenticated', function(socket) {
    connections.onAuth(socket, db);
  })

setInterval(() => {
  console.log('waiting users: ', users.getWaitingUsers(io))
}, 5000)

setInterval(() => {
  users.checkWaitingRoom(io, db, 2) // HOW MANY USERS!
}, 2000)


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


app.get('/dividends/:game', (req, res) => {
  games.getDividends(db, new mongo.ObjectId(req.params.game))
    .then(divs => res.json(divs))
});

app.get('/orders/:game', (req, res) => {
  db.collection('orders').find({ 'game._id': req.params.game })
    .toArray()
    .then(ords => res.json(ords))
});

http.listen(4000, function(){
  console.log('listening on *:4000');
});
