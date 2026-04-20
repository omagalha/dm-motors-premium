const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8 MB por arquivo
  },
});

module.exports = upload;
