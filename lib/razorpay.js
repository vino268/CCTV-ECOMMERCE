import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

export const getRazorpayClient = () => razorpay;

export default getRazorpayClient;
