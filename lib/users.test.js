const users = require('./users');
const expect = require('chai').expect;

var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';

var user = {
  id: 'foo',
  email: 'foo',
  name: 'foo',
  created: 100,
  games: [],
  connected: 100
}

var game = {
  id: 'foo',
  startTime: 100,
  endTime: 200
}


// user connects
// user disconnects

// add games to users once we have 6 waiting....
// create games for group


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

  describe('getWaitingUsers', () => {
    it('finds the right game for a new user', () => {
      return db.collection('users')
        .insertMany([
          { email: 'foo', connected: Date.now(), games: []},
          { email: 'foo', connected: Date.now(), games: [{ endTime: Date.now() - 1000*60*60 }] },
          { email: 'foo', connected: Date.now(), games: [{ endTime: Date.now() + 500 }] }
        ])
        .then(() => users.getWaitingUsers(db).toArray())
        .then(found => {
          expect(found.length).to.equal(2);
        })
    });
  });

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


  describe('disconnect/connect', () => {
    const date = Date.now();

    beforeEach(() => {
      return db.collection('users')
        .insertMany([
          { email: 'foo', connected: date, games: [] },
          { email: 'bar', connected: 0, games: [] },
        ])
    })

    it('updates connected on connect', () => {
      return users
        .connect(db, 'foo')
        .then(res => db.collection('users').findOne({email: 'foo'}))
        .then(user => {
          expect(user.connected > date).to.be.true;
        })
        .then(() => db.collection('users').findOne({email: 'bar'}))
        .then(user => {
          expect(user.connected === 0).to.be.true;
        })
    })

    it('updates connected on disconnect', () => {
      return users
        .disconnect(db, 'foo')
        .then(res => db.collection('users').findOne({email: 'foo'}))
        .then(user => {
          expect(user.connected === 0).to.be.true;
        });
    })
  })

  describe('assignRoom', () => {
    beforeEach(() => {
      return db.collection('users')
        .insertMany([
          { email: 'foo', connected: Date.now(), games: [] },
          { email: 'foo', connected: Date.now(), games: [] },
          { email: 'foo', connected: Date.now(), games: [] },
          { email: 'foo', connected: Date.now(), games: [{ endTime: Date.now() + 500 }] }
        ])
    })

    afterEach(() => db.dropCollection('games').catch(err => err));

    it('creates games in db', () => {
      return users.assignRoom(db, 3)
        .then(() => db.collection('games').find().toArray())
        .then(games => expect(games.length).to.equal(2))
    })


    it('updates users games field', () => {
      return users.assignRoom(db, 3)
        .then(u => db.collection('users').find().toArray())
        .then(found => {
          const g = found.map(f => f.games)
          expect(g[0].length).to.equal(2);
          expect(g[2].length).to.equal(2);
          expect(g[2][0]).to.have.property('startTime');
          expect(g[2][0]).to.eql(g[1][0])
          expect(g[0][1]).to.eql(g[1][1])
          expect(g[2][0]).to.not.eql(g[1][1])
        })
    })


    it('doesnt do anything when not enough users', () => {
      return users.assignRoom(db, 7)
        .then(u => db.collection('users').find().toArray())
        .then(found => {
          const g = found.map(f => f.games)
          expect(g[0].length).to.equal(0);
          expect(g[2].length).to.equal(0);
        })
    });
  })
})
