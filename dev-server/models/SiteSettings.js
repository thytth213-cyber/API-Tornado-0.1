/* SiteSettings model - stores global site configuration such as logo */
const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  logoUrl: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
