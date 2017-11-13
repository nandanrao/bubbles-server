const users = {};
const games = require('./games');

const isCurrent = (game) => Date.now() > game.endTime;
const minutes = (i) => 1000 * 60 * i;

users.getWaitingUsers = function (db) {
  return db.collection('users')
    .find({
      connected: { $gt: Date.now() - minutes(60) },
      $or: [
        {games: { $lt: { endTime: Date.now() - minutes(30) }}},
        {games: { $size: 0 }}
      ]
    });
}

users.assignRoom = function (db, min = 6) {
  // should take one user to see if in room first...
  let u;

  return users.getWaitingUsers(db).toArray()
    .then(_u => {
      u = _u;
      if (u.length >= min) {
        return games.createGames(db, 2)
      }
    })
    .then(games => {
      if (games) {
        u = u.slice(0, min);
        const update = {$push: { games : { $each: games }}};
        const ids = u.map(o => o._id);
        return db.collection('users').updateMany({ _id: { $in: ids }}, update);
      }
    })
}

users.disconnect = function (db, email) {
  return db.collection('users')
    .findOneAndUpdate({ email: email }, { $set: { connected: 0 }})
}

users.connect = function (db, email) {
  return db.collection('users')
    .findOneAndUpdate({ email: email }, { $set: { connected: Date.now() }})
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

module.exports = users;
