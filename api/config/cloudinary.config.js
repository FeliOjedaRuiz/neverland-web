const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

/**
 * Crea un uploader de multer configurado para una carpeta específica de Cloudinary.
 * @param {string} folderName - Ruta de carpeta en Cloudinary (ej. "neverland/activities")
 * @returns {object} Middleware multer configurado
 */
const createUploader = (folderName) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: folderName,
      allowed_formats: ["jpg", "png", "jpeg", "webp"],
      transformation: [
        { width: 2000, height: 2000, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    }
  });

  return multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }
  });
};

// Uploader por defecto para actividades (compatibilidad hacia atrás)
const activitiesUpload = createUploader("neverland/activities");

module.exports = activitiesUpload;
module.exports.createUploader = createUploader;
