import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'TN Automation' },
    storeDescription: {
      type: String,
      default: 'Professional CCTV and security solutions for businesses and homes.',
    },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

export default mongoose.models.SiteSettings ||
  mongoose.model('SiteSettings', SiteSettingsSchema);
