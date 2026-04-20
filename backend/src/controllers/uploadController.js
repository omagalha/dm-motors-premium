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

async function deleteImages(req, res) {
  try {
    const publicIds = Array.isArray(req.body?.publicIds)
      ? req.body.publicIds.map((value) => String(value).trim()).filter(Boolean)
      : [];

    if (!publicIds.length) {
      return res.status(400).json({ message: "Nenhum publicId valido foi enviado." });
    }

    const results = await Promise.all(
      publicIds.map(async (publicId) => {
        try {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
          });

          return {
            publicId,
            result: result.result,
            success: result.result === "ok" || result.result === "not found",
          };
        } catch (error) {
          return {
            publicId,
            result: "error",
            success: false,
            error: error.message,
          };
        }
      })
    );

    const failed = results.filter((item) => !item.success);

    return res.status(failed.length ? 207 : 200).json({
      deleted: results.filter((item) => item.success),
      failed,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Erro ao remover imagens do Cloudinary.",
      error: error.message,
    });
  }
}

module.exports = {
  deleteImages,
  uploadImages,
};
