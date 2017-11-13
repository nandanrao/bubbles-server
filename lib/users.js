const _ = require('lodash');
const users = {};
const games = require('./games');

const isCurrent = (game) => Date.now() > game.endTime;
const minutes = (i) => 1000 * 60 * i;


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
  const rooms = _(io.sockets).filter(s => s.rooms).flatten().value();
  // more...
}

module.exports = users;
