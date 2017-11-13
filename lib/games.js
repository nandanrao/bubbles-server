const _ = require('lodash');

const games = {};

const minutes = (i) => 1000 * 60 * i;

// 30 second delay at start of each game?
const gameLength = minutes(5) + minutes(.5)

games.createGames = function (db, num) {
  const start = Date.now();
  const games =_.range(num).map(i => ({
    startTime: start + i*gameLength,
    endTime: start + (i+1) * gameLength
  }))
  return db.collection('games')
    .insertMany(games)
    .then(res => res.ops)
}
// dividender
// loops
// db.collection('games').find({ }) // find games in progress
// filter by games that need dividend love
// emit event

module.exports = games;
