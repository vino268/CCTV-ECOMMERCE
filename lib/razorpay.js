import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

let razorpayInstance = null;

export function getRazorpayClient() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay environment variables are missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
}

const razorpayProxy = new Proxy(
  {},
  {
    get(_target, property) {
      const client = getRazorpayClient();
      const value = client[property];
      return typeof value === "function" ? value.bind(client) : value;
    },
  }
);

export default razorpayProxy;
