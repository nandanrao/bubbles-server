const io = require('socket.io-client');
const connections = require('./connections');
const users = require('./users');
const _ = require('lodash');
const expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/test';

describe('waiting logic', () => {
  let c1,c2,c3, server;
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

  before(() => {
    server = require('socket.io').listen(5000);
    server.use((socket,next) => {
      socket.decoded_token = { email: 'foo'}
      next()
    })
    server.on('connection', socket => connections.onAuth(socket));

    [c1,c2,c3] = _.range(3).map(i => io('http://localhost:5000'));
    [c1,c2,c3].forEach(c => {
      c.on('connect', () => c.emit('JOIN_WAITING_ROOM'))
    })
    c3.disconnect();
  })

  after(() => {
    [c1,c2,c3].forEach(c => c.disconnect());
    server.close();
  })

  it('gets waiting users', done => {
    setTimeout(() => {
      expect(users.getWaitingUsers(server)).to.eql(['foo', 'foo'])
      done()
    }, 100)
  })

  // it('does nothing when not enough waiting users', done => {

  //   setTimeout(() => {
  //     users.checkWaitingRoom(io, db, 5)
  //       .then(() => {
  //         db.collection('users')
  //       })
  //     done()
  //   }, 100)
  // })

  // it('notices when enough waiting users', done => {

  //   setTimeout(() => {
  //     expect(users.getWaitingUsers(server)).to.eql(['foo', 'foo'])
  //     done()
  //   }, 100)
  // })
})
