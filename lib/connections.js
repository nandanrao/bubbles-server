const users = require('./users');
const orders = require('./orders');
const connections = {};

connections.onAuth = function onAuth(socket, db) {
  const email = socket.decoded_token.email;
  console.log('connected: ' + email);
  socket
    .on('disconnect', () => {
      console.log('disconnect', email)
    })
    .on('SUBMIT_ORDER', order => {
      socket.to(order.game._id).emit('SUBMIT_ORDER', order);
      // save to DB!!!!!
    })
    .on('JOIN_WAITING_ROOM', game => {
      socket.join('waiting-room');
    })
    .on('JOIN_GAME', game => {
      socket.join(game).leave('waiting-room');
    })
}

module.exports = connections
