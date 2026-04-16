import { useEffect, useMemo, useState } from "react";
import {
  Bolt,
  Download,
  GripVertical,
  Star,
  Trash2,
  X
} from "lucide-react";
import { DndContext, closestCenter, useDraggable, useDroppable } from "@dnd-kit/core";
import { api } from "../services/api";

const THUMBNAIL_PROMPT_SUFFIX =
  "high contrast, bold lighting, cinematic, youtube thumbnail style, vibrant colors, sharp focus, dramatic composition";

function normalizeStoredItem(item, index = 0) {
  if (typeof item === "string") {
    return {
      id: `${item}-${Date.now()}-${index}`,
      imageUrl: item,
      prompt: "",
      aspectRatio: "16:9",
      createdAt: new Date().toISOString(),
      type: "image",
      textOverlay: "",
      isFavorite: false,
      order: index
    };
  }

  return {
    id: item.id || item._id || `${item.imageUrl || item.url}-${item.createdAt || Date.now()}-${index}`,
    imageUrl: item.imageUrl || item.url || "",
    prompt: item.prompt || "",
    aspectRatio: item.aspectRatio || "16:9",
    createdAt: item.createdAt || new Date().toISOString(),
    type: item.type === "thumbnail" ? "thumbnail" : "image",
    textOverlay: item.textOverlay || "",
    isFavorite: Boolean(item.isFavorite),
    order: typeof item.order === "number" ? item.order : index
  };
}

function resolveImageUrl(imageUrl) {
  return imageUrl || "";
}

function matchesFilter(item, filter) {
  if (filter === "all") return true;
  if (filter === "reels") return item.aspectRatio === "9:16";
  if (filter === "square") return item.aspectRatio === "1:1";
  if (filter === "landscape") return item.aspectRatio === "16:9";
  if (filter === "thumbnails") return item.type === "thumbnail";
  if (filter === "favorites") return item.isFavorite;
  return true;
}

function reorderItems(items, activeId, overId, activeFilter) {
  const visibleItems = items.filter((item) => matchesFilter(item, activeFilter));
  const movedItem = visibleItems.find((item) => item.id === activeId);
  const targetItem = visibleItems.find((item) => item.id === overId);

  if (!movedItem || !targetItem || movedItem.id === targetItem.id) {
    return items;
  }

  const oldIndex = items.findIndex((item) => item.id === movedItem.id);
  const newIndex = items.findIndex((item) => item.id === targetItem.id);

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);

  return next.map((item, index) => ({ ...item, order: index }));
}

function GalleryCard({
  item,
  isUniformGrid,
  isDraggable,
  onDelete,
  onOpen,
  onToggleFavorite
}) {
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !isDraggable
  });
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: item.id,
    disabled: !isDraggable
  });

  const setNodeRef = (node) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group overflow-hidden rounded-[1.5rem] border bg-white p-2 shadow-soft transition ${
        isDragging ? "z-20 opacity-90 shadow-2xl" : ""
      } ${
        isOver ? "border-studio-primary" : "border-gray-200 dark:border-gray-700"
      } dark:bg-gray-800`}
    >
      <div className="relative cursor-pointer overflow-hidden rounded-lg" onClick={() => onOpen(item)}>
        <img
          src={resolveImageUrl(item.imageUrl)}
          alt={item.prompt || "Creation"}
          className={`w-full rounded-lg transition-transform duration-300 ${
            isUniformGrid
              ? "h-[200px] object-cover group-hover:scale-110"
              : "h-auto object-contain group-hover:scale-[1.03]"
          }`}
        />
        {item.textOverlay && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-gradient-to-t from-black/65 via-black/10 to-black/45 p-4">
            <p className="mt-2 max-w-[90%] text-center text-lg font-black uppercase leading-tight tracking-[0.04em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
              {item.textOverlay}
            </p>
          </div>
        )}
        {item.type === "thumbnail" && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-white">
            Thumbnail
          </span>
        )}
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${
              item.isFavorite ? "bg-amber-400 text-black" : "bg-white/90 text-gray-900"
            }`}
            aria-label="Toggle favorite"
          >
            <Star size={16} fill={item.isFavorite ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item.id);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-900"
            aria-label="Delete image"
          >
            <Trash2 size={16} />
          </button>
        </div>
        {isDraggable && (
          <button
            type="button"
            className="absolute bottom-3 right-3 inline-flex h-9 w-9 cursor-grab items-center justify-center rounded-full bg-black/70 text-white active:cursor-grabbing"
            aria-label="Drag to reorder"
            onClick={(event) => event.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <GripVertical size={16} />
          </button>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            {item.aspectRatio}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </div>
        {item.prompt && <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{item.prompt}</p>}
      </div>
    </article>
  );
}

function ImageGeneratorPage() {
  const [mode, setMode] = useState("image");
  const [filter, setFilter] = useState("all");
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [style, setStyle] = useState("Photorealistic");
  const [lighting, setLighting] = useState("Golden Hour");
  const [textOverlay, setTextOverlay] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    localStorage.removeItem("studio-recent-generated-images");
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingImages(true);
      try {
        const response = await api.getImages();
        const nextImages = (response.data || []).map(normalizeStoredItem);
        setImages(nextImages);
      } catch {
        setImages([]);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    if (!selectedImage) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage]);

  const filteredImages = useMemo(
    () => images.filter((img) => matchesFilter(img, filter)),
    [filter, images]
  );

  const isUniformGrid = filter === "all";

  const syncImages = (nextImages) => {
    setImages(nextImages);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await api.generateImage({
        prompt,
        aspectRatio: mode === "thumbnail" ? "16:9" : aspectRatio,
        style,
        lighting,
        mode,
        type: mode === "thumbnail" ? "thumbnail" : "image",
        textOverlay
      });

      const item = normalizeStoredItem({
        id: data.data?.id,
        imageUrl: data.data?.imageUrl || "",
        prompt,
        aspectRatio: data.data?.aspectRatio || (mode === "thumbnail" ? "16:9" : aspectRatio),
        createdAt: data.data?.createdAt || new Date().toISOString(),
        type: data.data?.type || mode,
        textOverlay: mode === "thumbnail" ? textOverlay.trim() : "",
        isFavorite: Boolean(data.data?.isFavorite),
        order: typeof data.data?.order === "number" ? data.data.order : images.length
      });

      setResult(item);
      setImages((prev) => [
        item,
        ...prev.map((existingItem, index) => ({
          ...existingItem,
          order: index + 1
        }))
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const nextImages = images.filter((item) => item.id !== id);
    syncImages(nextImages);

    if (result?.id === id) {
      setResult(null);
    }

    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }

    try {
      await api.deleteImage(id);
    } catch {
      // Keep the local update so the UI stays responsive even if the backend delete fails.
    }
  };

  const toggleFavorite = async (id) => {
    const nextImages = images.map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    syncImages(nextImages);

    try {
      await api.toggleFavoriteImage(id);
    } catch {
      syncImages(images);
    }
  };

  const persistReorder = async (nextImages) => {
    syncImages(nextImages);

    try {
      await api.reorderImages(nextImages.map((item, index) => ({ id: item.id, order: index })));
    } catch {
      // Leave the local order intact to avoid a jarring UI reset.
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!active?.id || !over?.id || active.id === over.id) {
      return;
    }

    const nextImages = reorderItems(images, active.id, over.id, filter);
    await persistReorder(nextImages);
  };

  return (
    <div className="space-y-8 studio-animate-in">
      <section>
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">Image Generator</h1>
        <p className="mt-2 max-w-3xl text-[1.4rem] text-gray-600 dark:text-gray-300">
          Bring your creative visions to life with polished images, scroll-stopping thumbnails, and a gallery that stays organized.
        </p>
      </section>

      <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-700 dark:bg-gray-800 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-studio-primary">Creative Generator</p>
          <div className="inline-flex rounded-full bg-gray-100 p-1 dark:bg-gray-700">
            <button
              type="button"
              onClick={() => setMode("image")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "image"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              Image Generator
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("thumbnail");
                setAspectRatio("16:9");
              }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === "thumbnail"
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-300"
              }`}
            >
              Thumbnail Generator
            </button>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-4 h-28 w-full rounded-3xl bg-gray-100 px-5 py-4 text-[1.1rem] text-gray-900 outline-none dark:bg-gray-700 dark:text-white"
          placeholder={
            mode === "thumbnail"
              ? "Make a YouTube thumbnail for: How to grow on Instagram fast"
              : "A futuristic lounge in the clouds, ethereal lighting, cinematic architecture..."
          }
        />

        <div className="mt-5 grid gap-3 lg:grid-cols-2 xl:grid-cols-[140px_160px_160px_1fr_200px]">
          <select
            value={mode === "thumbnail" ? "16:9" : aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            disabled={mode === "thumbnail"}
            className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white"
          >
            <option value="1:1">1:1 (Square)</option>
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Reel / Story)</option>
            <option value="4:5">4:5 (Instagram Portrait)</option>
            <option value="5:4">5:4 (Feed Landscape)</option>
            <option value="4:3">4:3 (Classic Landscape)</option>
            <option value="3:4">3:4 (Classic Portrait)</option>
            <option value="3:2">3:2 (Photo Wide)</option>
            <option value="2:3">2:3 (Poster Portrait)</option>
            <option value="21:9">21:9 (Cinematic Banner)</option>
          </select>
          <select value={style} onChange={(e) => setStyle(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
            <option>Photorealistic</option>
            <option>3D Render</option>
            <option>Illustration</option>
            <option>Concept Art</option>
            <option>Minimalist</option>
          </select>
          <select value={lighting} onChange={(e) => setLighting(e.target.value)} className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
            <option>Golden Hour</option>
            <option>Studio</option>
            <option>Cinematic</option>
            <option>Soft Ambient</option>
            <option>Low Key</option>
          </select>
          <input
            value={textOverlay}
            onChange={(e) => setTextOverlay(e.target.value)}
            className="h-11 rounded-full bg-gray-100 px-4 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-700 dark:text-white"
            placeholder={mode === "thumbnail" ? "Text overlay (optional)" : "Text overlay disabled for images"}
            disabled={mode !== "thumbnail"}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6e3df5] to-[#9670ff] text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
          >
            <Bolt size={15} /> {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {mode === "thumbnail" && (
          <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            <p className="font-semibold">Thumbnail mode enhancement</p>
            <p className="mt-1 whitespace-pre-line">
              Your prompt is automatically enhanced with: {THUMBNAIL_PROMPT_SUFFIX}
            </p>
            <p className="mt-2 font-medium">Thumbnail output is locked to true 16:9 for generation and display.</p>
          </div>
        )}

        {error && <p className="mt-3 whitespace-pre-line text-sm text-rose-600">{error}</p>}
      </section>

      {result && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Latest Result</h2>
            <button
              type="button"
              onClick={() => setSelectedImage(result)}
              className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 dark:bg-gray-700 dark:text-white"
            >
              Open Preview
            </button>
          </div>
          <div className="max-w-4xl rounded-xl border border-gray-200 bg-white p-2 shadow-soft dark:border-gray-700 dark:bg-gray-800">
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={resolveImageUrl(result.imageUrl)}
                alt={result.prompt || "Latest result"}
                className="w-full max-h-[500px] object-contain"
              />
              {result.textOverlay && (
                <div className="pointer-events-none absolute inset-0 flex items-start justify-center bg-gradient-to-t from-black/65 via-black/15 to-black/45 p-4">
                  <p className="mt-2 max-w-[90%] text-center text-lg font-black uppercase leading-tight tracking-[0.04em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] sm:text-xl">
                    {result.textOverlay}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">Image Gallery</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              Default view keeps the grid uniform. Filtered views show the real aspect ratio.
            </p>
          </div>
          <span className="rounded-full bg-[#eadbff] px-3 py-1 text-xs font-semibold text-studio-primary">
            {images.length} Total
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["reels", "Reels"],
            ["square", "Square"],
            ["landscape", "Landscape"],
            ["thumbnails", "Thumbnails"],
            ["favorites", "Favorites"]
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === value
                  ? "bg-studio-primary text-white"
                  : "bg-white text-gray-700 shadow-soft dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filteredImages.length > 1 && (
          <p className="text-sm text-gray-500 dark:text-gray-300">
            Drag images using the handle to reorder your gallery.
          </p>
        )}

        {loadingImages ? (
          <div className="rounded-[1.5rem] border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
            Loading your gallery...
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
            No images match this filter yet.
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div
              className={`grid items-start gap-4 ${
                filter === "thumbnails"
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {filteredImages.map((item) => (
                <GalleryCard
                  key={item.id}
                  item={item}
                  isUniformGrid={isUniformGrid}
                  isDraggable={filteredImages.length > 1}
                  onDelete={handleDelete}
                  onOpen={setSelectedImage}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </DndContext>
        )}
      </section>

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
            onClick={() => setSelectedImage(null)}
          />
          <div
            className="relative z-50 mx-4 w-full max-w-5xl rounded-[1.5rem] bg-white p-4 shadow-2xl pointer-events-auto dark:bg-gray-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3 pr-12">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.08em] text-studio-primary">
                  {selectedImage.type === "thumbnail" ? "Thumbnail" : "Image"} | {selectedImage.aspectRatio}
                </p>
                {selectedImage.prompt && (
                  <p className="mt-1 max-w-3xl whitespace-pre-line text-sm text-gray-600 dark:text-gray-300">
                    {selectedImage.prompt}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/85"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>
            <div className="relative overflow-hidden rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
              <img
                src={resolveImageUrl(selectedImage.imageUrl)}
                alt={selectedImage.prompt || "Preview"}
                className="max-h-[85vh] w-full rounded-lg object-contain"
              />
              {selectedImage.textOverlay && (
                <div className="pointer-events-none absolute inset-3 flex items-start justify-center bg-gradient-to-t from-black/65 via-black/10 to-black/45 p-4">
                  <p className="mt-2 max-w-[90%] text-center text-xl font-black uppercase leading-tight tracking-[0.04em] text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] sm:text-3xl">
                    {selectedImage.textOverlay}
                  </p>
                </div>
              )}
              <a
                href={resolveImageUrl(selectedImage.imageUrl)}
                download={`studio-${selectedImage.type}-${selectedImage.id}.png`}
                className="absolute bottom-3 right-3 inline-flex h-10 items-center gap-2 rounded-full bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                <Download size={16} /> Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGeneratorPage;
