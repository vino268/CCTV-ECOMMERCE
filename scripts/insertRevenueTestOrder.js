const mongoose = require("mongoose");

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://vinothelango2110_db_user:Vinoth2026@vinoth.g6th8dt.mongodb.net/tn_automation?retryWrites=true&w=majority&appName=Vinoth";

const OrderSchema = new mongoose.Schema({}, { strict: false });

(async () => {
  try {
    await mongoose.connect(uri);
    const Order = mongoose.model("OrderInsert", OrderSchema, "orders");

    const result = await Order.create({
      totalAmount: 1000,
      paymentStatus: "Paid",
      status: "Delivered",
      createdAt: new Date(),
      isDeleted: false,
      orderId: `#TN-REV-${Date.now()}`,
      orderNumber: `ORD-REV-${Date.now()}`,
      customerName: "Revenue Test Customer",
      email: "revenue-test@example.com",
      phone: "+910000000000",
    });

    console.log("Inserted revenue test order:", result._id.toString());
  } catch (error) {
    console.error("Failed to insert revenue test order:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
