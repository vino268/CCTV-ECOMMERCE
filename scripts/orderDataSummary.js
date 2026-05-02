const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://vinothelango2110_db_user:Vinoth2026@vinoth.g6th8dt.mongodb.net/tn_automation?retryWrites=true&w=majority&appName=Vinoth';
const OrderSchema = new mongoose.Schema({}, { strict: false });

(async () => {
  try {
    await mongoose.connect(uri);
    const Order = mongoose.model('Order', OrderSchema, 'orders');

    const invalidStatusValues = await Order.aggregate([
      { $match: { status: { $exists: true, $nin: ['Pending', 'Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const invalidOrderStatusValues = await Order.aggregate([
      { $match: { orderStatus: { $exists: true, $nin: ['Pending', 'Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Confirmed'] } } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    const missingStatus = await Order.countDocuments({ status: { $exists: false } });
    const missingOrderStatus = await Order.countDocuments({ orderStatus: { $exists: false } });

    console.log('INVALID status values:', JSON.stringify(invalidStatusValues, null, 2));
    console.log('INVALID orderStatus values:', JSON.stringify(invalidOrderStatusValues, null, 2));
    console.log('MISSING status:', missingStatus);
    console.log('MISSING orderStatus:', missingOrderStatus);

  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await mongoose.disconnect();
  }
})();
