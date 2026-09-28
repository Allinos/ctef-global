const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '..', 'public', 'uploads');

function makeUploader(subfolder) {
  const dest = path.join(UPLOAD_ROOT, subfolder);
  fs.mkdirSync(dest, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only JPEG, PNG, WEBP or GIF images are allowed.'), ok);
  };

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
}

module.exports = {
  eventsUpload: makeUploader('events'),
  galleryUpload: makeUploader('gallery'),
  journalUpload: makeUploader('journal'),
  newsUpload: makeUploader('news'),
  publicPathFor: (subfolder, filename) => `/uploads/${subfolder}/${filename}`,
  // For multipart forms that aren't persisted (membership application, contact
  // form): parses text fields correctly without writing any file to disk.
  memoryUpload: multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }),
};
