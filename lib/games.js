const _ = require('lodash');
const games = {};

// --------------- FROM CLIENT ---------------
// -------------------------------------------

function getRoundTimes(game) {
  const trueStart = game.startTime + game.conf.waitTime
  return _.range(game.conf.rounds).map(i => trueStart + game.conf.roundTime*i)
}

function getRound(game) {
  const rounds = getRoundTimes(game)
  const now = Date.now()
  const round = _.takeWhile(rounds, t => now > t).length - 1
  return round >= 0 ? round : null;
}

// ------------------------------------------
// ------------------------------------------

const minutes = (i) => 1000 * 60 * i;

// CONF --------------------
const gameConfig = {
  roundTime: minutes(.5),
  waitTime: minutes(.5),
  rounds: 10,
  payouts: [0.05, 0.2,.8]
}

// -------------------------

function gameLength(c) {
  return c.roundTime * c.rounds + c.waitTime
}


games.treatNextGame = async function (db) {
  const treated = await db.collection('games').find({ treated: true}).count();
  const untreated = await db.collection('games').find({ treated: false}).count();
  return treated < untreated;
}

games.createDividends = function (conf) {
  const pick = () => Math.floor(Math.random()*conf.payouts.length)
  return _.range(conf.rounds).map(i => conf.payouts[pick()])
}


games.createGames = async function (db, num, conf = gameConfig) {
  const treated = await games.treatNextGame(db);
  const start = Date.now();
  const dividends = games.createDividends(conf)
  const gs =_.range(num).map(i => ({
    conf,
    dividends,
    treated,
    startTime: start + i*gameLength(conf),
    endTime: start + (i+1) * gameLength(conf) // add round length?
  }))
  return db.collection('games')
    .insertMany(gs)
    .then(res => res.ops)
}

games.getDividends = function (db, gameId) {
  return db.collection('games')
    .findOne({ _id: gameId })
    .then(g => {
      const r = getRound(g);
      return g.dividends.slice(0, r);
    })
}

games.gameLength = gameLength;
module.exports = games;
