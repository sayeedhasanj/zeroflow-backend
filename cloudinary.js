const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'dqcchopou',
  api_key: '859854666578142',
  api_secret: '6r9aAn4AaAd3iMF01n9JBwwYkFk',
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'zeroflow-products',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

module.exports = { cloudinary, storage };
