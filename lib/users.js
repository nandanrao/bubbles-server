const _ = require('lodash');
const users = {};
const games = require('./games');
const connections = require('./connections');
const isCurrent = (game) => Date.now() > game.endTime;
const minutes = (i) => 1000 * 60 * i;

function getRooms(socket) {
  return Object.keys(socket.rooms)
    .filter(k => k !== socket.id)
}

users.assignGames = async function (db, emails) {
  const userz = await db.collection('users')
        .find({ email: { $in: emails }}).toArray()
  const gamez = await games.createGames(db, 2)
  const update = { $push: { games : {
    $each: gamez.map(g => _.omit(g, 'dividends'))
  }}};
  const ids = userz.map(o => o._id);
  return db.collection('users').updateMany({ _id: { $in: ids }}, update);

}

users.createUser = function (db, info) {
  return db.collection('users').insert({
    email: info.email,
    name: info.name,
    created: Date.now(),
    games: [],
    connected: 0
  }).then(res => res.ops[0]);
}

users.getGames = async function (db, email) {
  const user = await db.collection('users').findOne({ email: email });
  if (!user) return console.error('no user?????');
  return user.games.filter(g => g.endTime > Date.now());
}


users.getWaitingUsers = function (io) {
  const sockets = _.values(io.sockets.connected)
        .filter(s => getRooms(s).indexOf('waiting-room') !== -1)
  return sockets.map(s => s.decoded_token.email)
}

users.checkWaitingRoom = async function (io, db, min = 6) {
  const waiting = users.getWaitingUsers(io)
  if (waiting.length >= min) {
    await users.assignGames(db, waiting)
    io.to('waiting-room').emit('NEW_GAMES')
  }
  return false;
}
module.exports = users;
