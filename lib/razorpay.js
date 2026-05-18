import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Razorpay test keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local");
}

if (!String(keyId).startsWith("rzp_test_")) {
  throw new Error("Only Razorpay test mode keys are allowed at this stage.");
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default razorpay;
