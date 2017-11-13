const games = require('./games');
const expect = require('chai').expect;

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';

describe('games', () => {
  let db;

  before(done => {
    MongoClient.connect(url)
      .then(_db => {
        db = _db;
        done();
      });
  });

  after(done => {
    db.dropCollection('games').then(() => {
      done();
    }).catch(err => {
      done();
    })
  })

  describe('createGames', () => {
    it('creates 2 games back-to-back in DB', () => {
      return games.createGames(db, 2)
        .then(games => {
          expect(games.length).to.equal(2);
          expect(games[0]._id).to.exist;
          expect(games[0].startTime < games[1].startTime).to.be.true;
          expect(games[0].endTime == games[1].startTime).to.be.true;
          expect(games[0].endTime < games[1].endTime).to.be.true;
        })
        .then(() => db.collection('games').find().toArray())
        .then(games => {
          expect(games.length).to.equal(2);
        })
    });

  });
})
