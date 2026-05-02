const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://vinothelango2110_db_user:Vinoth2026@vinoth.g6th8dt.mongodb.net/tn_automation?retryWrites=true&w=majority&appName=Vinoth';
const OrderSchema = new mongoose.Schema({}, { strict: false });

function normalizeStatus(value) {
  if (!value || typeof value !== 'string') return 'Ordered';
  const normalized = value.trim();
  if (normalized === 'Confirmed') return 'Packed';
  if (normalized === 'OutForDelivery') return 'Out for Delivery';
  if (['Pending', 'Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'].includes(normalized)) return normalized;
  return 'Ordered';
}

function normalizePaymentStatus(value, normalizedStatus) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (['Paid', 'Unpaid', 'Pending', 'Refunded'].includes(trimmed)) {
      return trimmed;
    }
  }

  if (normalizedStatus === 'Delivered') {
    return 'Paid';
  }

  return 'Unpaid';
}

(async () => {
  try {
    await mongoose.connect(uri);
    const Order = mongoose.model('Order', OrderSchema, 'orders');

    const docs = await Order.find({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: '' },
        { paymentStatus: { $exists: false } },
        { paymentStatus: null },
        { paymentStatus: '' },
        { orderStatus: 'OutForDelivery' },
        { trackingStatus: 'OutForDelivery' },
        { status: 'Delivered' },
        { orderStatus: 'Delivered' },
        { trackingStatus: 'Delivered' },
      ],
    }).lean();

    if (!docs.length) {
      console.log('No documents need status or orderStatus normalization.');
      return;
    }

    const ops = docs.map((doc) => {
      const updated = {};
      const normalizedStatus = normalizeStatus(doc.status || doc.orderStatus || doc.trackingStatus);
      if (!doc.status || doc.status === null || doc.status === '') {
        updated.status = normalizedStatus;
      }
      if (doc.orderStatus === 'OutForDelivery') {
        updated.orderStatus = 'Out for Delivery';
      }
      if (doc.trackingStatus === 'OutForDelivery') {
        updated.trackingStatus = 'Out for Delivery';
      }
      if (normalizedStatus === 'Delivered') {
        updated.paymentStatus = 'Paid';
      } else if (!doc.paymentStatus || doc.paymentStatus === null || doc.paymentStatus === '') {
        updated.paymentStatus = normalizePaymentStatus(doc.paymentStatus, normalizedStatus);
      }
      if (Object.keys(updated).length === 0) return null;
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: updated },
        },
      };
    }).filter(Boolean);

    if (!ops.length) {
      console.log('No eligible document updates were generated.');
      return;
    }

    const result = await Order.bulkWrite(ops);
    console.log('Updated documents:', result.nModified || result.modifiedCount || 0);
    console.log('Total ops:', ops.length);
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    await mongoose.disconnect();
  }
})();
