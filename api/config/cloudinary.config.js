const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});
 
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "neverland/activities",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [
      { width: 2000, height: 2000, crop: "limit" }, // Evita imágenes exageradamente grandes
      { quality: "auto" }, // Optimiza peso automáticamente
      { fetch_format: "auto" } // Sirve el formato más ligero según navegador
    ]
  }
});
 
module.exports = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // Límite de 20MB
});