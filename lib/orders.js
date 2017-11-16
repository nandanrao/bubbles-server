const orders = {};

orders.saveOrder = function(db, order) {
  return db.collection('orders').insertOne(order);
};

module.exports = orders;
