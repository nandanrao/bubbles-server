const orders = {};

orders.saveOrder = function(db, order) {
  console.log('saving order to db...', order)
  return db.collection('orders').insertOne(order);
};

module.exports = orders;
