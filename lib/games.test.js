const games = require('./games');
const expect = require('chai').expect;
const _ = require('lodash');

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';

describe('games', () => {

  const minutes = (i) => 1000 * 60 * i;
  let db;

  before(done => {
    MongoClient.connect(url)
      .then(_db => {
        db = _db;
        done();
      });
  });

  afterEach(done => {
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

  describe('treatNextGame', () => {
    it('should return false if more treated then untreated', () => {
      return db.collection('games').insertMany([
        { treated: false }, { treated: true }, { treated: true}
      ]).then(() => {
        return games.treatNextGame(db)
      }).then(treat => {
        expect(treat).to.be.false
      })
    });

    it('should return true otherwise', () => {
      return db.collection('games').insertMany([
        { treated: false }, { treated: false }, { treated: true}
      ])
        .then(() => games.treatNextGame(db))
        .then(treat => {
          expect(treat).to.be.true;
        })

    });
  })

  describe('getDividends', () => {
    let ids;
    const conf = {
      roundTime: minutes(.5),
      waitTime: minutes(.5),
      rounds: 10
    }

    beforeEach(() => {
      return db.collection('games').insertMany([
        { conf, dividends: [1,2,3], startTime: Date.now() - minutes(1.6) },
        { conf, dividends: [3,4], startTime: Date.now() - minutes(0.3) },
        { conf, dividends: [3,4], startTime: Date.now() + minutes(1) }
      ]).then(res => ids = res.insertedIds);
    })

    it('gets Dividends from a game in progress', () => {
      return games.getDividends(db, ids[0])
        .then(divs => {
          expect(divs).to.eql([1,2])
        })
    })
    it('gets Dividends from a game just begun', () => {
      return games.getDividends(db, ids[1])
        .then(divs => {
          expect(divs).to.eql([])
        })
    })
    it('gets Dividends from a game not yet begun', () => {
      return games.getDividends(db, ids[2])
        .then(divs => {
          expect(divs).to.eql([])
        })
    })
  });

  describe('createDividends', () => {

    it('creates from the choices its given, reasonably', () => {
      const conf = { rounds: 100, payouts: [0.2, 0.5, 0.7] };
      const divs = games.createDividends(conf)
      expect(_.sortBy(_.uniq(divs))).to.eql([0.2, 0.5, 0.7])
      expect(divs.filter(d => d == .2).length > 4).to.be.true;
      expect(divs.filter(d => d == .5).length > 4).to.be.true;
      expect(divs.filter(d => d == .7).length > 4).to.be.true;
    });
  })
})
