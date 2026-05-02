const mongoose = require("mongoose");

const uri =
  process.env.MONGODB_URI ||
  "mongodb+srv://vinothelango2110_db_user:Vinoth2026@vinoth.g6th8dt.mongodb.net/tn_automation?retryWrites=true&w=majority&appName=Vinoth";

const OrderSchema = new mongoose.Schema({}, { strict: false });

(async () => {
  try {
    await mongoose.connect(uri);
    const Order = mongoose.model("OrderRevenueCheck", OrderSchema, "orders");

    const startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 6);

    const filter = {
      isDeleted: false,
      createdAt: { $gte: startDate },
      $or: [{ paymentStatus: "Paid" }, { status: "Delivered" }],
    };

    const revenueData = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    console.log("Revenue Filter:", filter);
    console.log("Revenue Aggregation Result:", revenueData);
    console.log("Computed Total Revenue:", totalRevenue);
  } catch (error) {
    console.error("Revenue check failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
