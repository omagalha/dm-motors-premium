const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

function uploadBuffer(fileBuffer, folder = "dm-motors") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
}

async function uploadImages(req, res) {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({ message: "Nenhuma imagem enviada." });
    }

    const uploads = await Promise.all(
      files.map((file) => uploadBuffer(file.buffer, "dm-motors/vehicles"))
    );

    const images = uploads.map((item) => ({
      url: item.secure_url,
      publicId: item.public_id,
      width: item.width,
      height: item.height,
      format: item.format,
    }));

    return res.status(201).json(images);
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao enviar imagens para o Cloudinary.",
      error: error.message,
    });
  }
}

module.exports = {
  uploadImages,
};
