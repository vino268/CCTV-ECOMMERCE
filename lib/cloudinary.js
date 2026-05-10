require("dotenv").config();
const { v2: cloudinary } = require('cloudinary');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log("CLOUDINARY BOOTSTRAP (CJS) ->", {
  cloudName: Boolean(cloudName),
  apiKey: Boolean(apiKey),
  apiSecretExists: Boolean(apiSecret),
});

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary;
