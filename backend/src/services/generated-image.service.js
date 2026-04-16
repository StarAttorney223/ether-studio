import { GeneratedImage } from "../models/GeneratedImage.js";
import cloudinary from "../config/cloudinary.js";

export async function listGeneratedImages(limit = 200) {
  return GeneratedImage.find()
    .sort({ order: 1, createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function createGeneratedImage(payload) {
  return GeneratedImage.create(payload);
}

export async function createGeneratedImageAtTop(payload) {
  await GeneratedImage.updateMany({}, { $inc: { order: 1 } });
  return createGeneratedImage({ ...payload, order: 0 });
}

export async function deleteGeneratedImageById(id) {
  const deleted = await GeneratedImage.findByIdAndDelete(id).lean();

  if (deleted?.imagePublicId) {
    await cloudinary.uploader.destroy(deleted.imagePublicId, { resource_type: "image" }).catch(() => null);
  }

  return deleted;
}

export async function toggleFavoriteImageById(id) {
  const image = await GeneratedImage.findById(id);

  if (!image) {
    return null;
  }

  image.isFavorite = !image.isFavorite;
  await image.save();
  return image.toObject();
}

export async function reorderGeneratedImages(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  await Promise.all(
    items.map((item, index) =>
      GeneratedImage.findByIdAndUpdate(item.id, { order: typeof item.order === "number" ? item.order : index })
    )
  );

  return listGeneratedImages();
}
