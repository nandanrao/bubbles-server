const users = require('./users');
const expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';

describe('users', () => {
  let db;

  before(done => {
    MongoClient.connect(url)
      .then(_db => {
        db = _db;
        done();
      });
  });

  afterEach(done => {
    db.dropCollection('users').then(() => {
      done();
    }).catch(err => {
      done();
    })
  })

  describe('createuser', () => {
    it('creates a user ', () => {
      return users
        .createUser(db, { email: 'foo', name: 'bar' })
        .then(user => {
          expect(user._id).to.exist;
          expect(user.name).to.equal('bar');
          expect(user.games).to.eql([]);
        })
    })
  })

  describe('getGames', () => {
    beforeEach(() => {
      return db.collection('users')
        .insertMany([
          { email: 'foo', connected: Date.now(), games: [
            { endTime: Date.now() + 500 },
            { endTime: Date.now() + 500000 },
            { endTime: Date.now() - 500 }
          ]}
        ])
    })
    it('gets all future and current games ', () => {
      return users
        .getGames(db, 'foo')
        .then(games => {
          expect(games.length).to.equal(2)
        })
    })
  })

  describe('assignGames', () => {
    beforeEach(() => {
      return db.collection('users')
        .insertMany([
          { email: 'bar', connected: Date.now(), games: [] },
          { email: 'foo', connected: Date.now(), games: [] }
        ])
    })

    afterEach(() => db.dropCollection('games').catch(err => err));

    it('creates games in db with dividends', () => {
      return users.assignGames(db, ['foo'])
        .then(() => db.collection('games').find().toArray())
        .then(games => {
          expect(games.length).to.equal(2)
          expect(games[0].dividends.length > 1).to.be.true;
        })
    })

    it('updates users games field', () => {
      return users.assignGames(db, ['foo', 'bar'])
        .then(u => db.collection('users').find().toArray())
        .then(found => {
          const g = found.map(f => f.games)
          expect(g[0].length).to.equal(2);
          expect(g[1].length).to.equal(2);
          expect(g[1][0]).to.eql(g[0][0]);
          expect(g[1][1]).to.eql(g[0][1]);
          expect(g[1][0]).to.not.eql(g[0][1]);
        })
    })

    it('does not give the users the dividends', () => {
      return users.assignGames(db, ['foo', 'bar'])
        .then(u => db.collection('users').find().toArray())
        .then(found => {
          const g = found.map(f => f.games)
          expect(g[0].dividends).to.be.undefined;
          expect(g[1].dividends).to.be.undefined;
        })
    })
  })
})
