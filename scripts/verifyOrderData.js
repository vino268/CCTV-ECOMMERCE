const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://vinothelango2110_db_user:Vinoth2026@vinoth.g6th8dt.mongodb.net/tn_automation?retryWrites=true&w=majority&appName=Vinoth';

const OrderSchema = new mongoose.Schema({}, { strict: false });

(async () => {
  try {
    await mongoose.connect(uri);
    const Order = mongoose.model('Order', OrderSchema, 'orders');
    const total = await Order.countDocuments();
    const missingTotalAmount = await Order.countDocuments({ $or: [{ totalAmount: { $exists: false } }, { totalAmount: null }] });
    const missingPaymentStatus = await Order.countDocuments({ $or: [{ paymentStatus: { $exists: false } }, { paymentStatus: null }, { paymentStatus: '' }] });
    const invalidPaymentStatus = await Order.countDocuments({ paymentStatus: { $nin: ['Paid', 'Unpaid', 'Pending', 'Refunded'] } });
    const missingStatus = await Order.countDocuments({ $or: [{ status: { $exists: false } }, { status: null }, { status: '' }] });
    const invalidStatus = await Order.countDocuments({ status: { $nin: ['Pending', 'Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] } });
    const sample = await Order.find({
      $or: [
        { totalAmount: { $exists: false } },
        { paymentStatus: { $exists: false } },
        { status: { $exists: false } },
        { paymentStatus: { $nin: ['Paid', 'Unpaid', 'Pending', 'Refunded'] } },
        { status: { $nin: ['Pending', 'Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'] } },
      ],
    })
      .limit(10)
      .lean();

    console.log('TOTAL ORDERS:', total);
    console.log('MISSING totalAmount:', missingTotalAmount);
    console.log('MISSING paymentStatus:', missingPaymentStatus);
    console.log('INVALID paymentStatus:', invalidPaymentStatus);
    console.log('MISSING status:', missingStatus);
    console.log('INVALID status:', invalidStatus);
    console.log('SAMPLE BAD ORDERS:', JSON.stringify(sample, null, 2));
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await mongoose.disconnect();
  }
})();
