const previewTabs = ["Instagram", "LinkedIn", "Twitter / X", "YouTube"];
const youtubePlaceholder =
  "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=80";

function renderMedia(media, className) {
  if (!media) {
    return null;
  }

  if (media.startsWith("data:video")) {
    return <video src={media} className={className} muted controls={false} />;
  }

  return <img src={media} alt="Preview media" className={className} />;
}

function PostPreview({
  content,
  media,
  platform,
  hashtags = [],
  onPlatformChange,
  availablePlatforms = previewTabs,
  title = "",
  description = "",
  thumbnail = ""
}) {
  const tabs = previewTabs.filter((item) => availablePlatforms.includes(item));
  const activePlatform = tabs.includes(platform) ? platform : tabs[0] || "Instagram";
  const youtubeArtwork = thumbnail || (!media?.startsWith("data:video") ? media : "") || youtubePlaceholder;

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-4 shadow-soft dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex rounded-full bg-gray-100 p-1 text-xs font-semibold dark:bg-gray-700">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => onPlatformChange?.(item)}
            className={`flex-1 rounded-full px-3 py-1.5 ${
              activePlatform === item
                ? "bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
                : "text-gray-500 dark:text-gray-300"
            }`}
          >
            {item.replace(" / X", "")}
          </button>
        ))}
      </div>

      {activePlatform === "Instagram" && (
        <div className="mx-auto w-[270px] rounded-[2.3rem] border-[10px] border-[#0a1b3d] bg-white p-3">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">Instagram</p>
          <div className="mt-2 h-8 rounded-lg bg-gray-100 dark:bg-gray-700" />
          <div className="mt-2 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
            {media ? (
              renderMedia(media, "h-52 w-full object-cover")
            ) : (
              <div className="grid h-52 place-items-center text-xs text-gray-500 dark:text-gray-300">No media selected</div>
            )}
          </div>
          <div className="mt-2 space-y-1 text-xs text-gray-900 dark:text-white">
            <p className="font-semibold">ether_studio_ai</p>
            <p className="line-clamp-4 whitespace-pre-wrap">{content || "Your caption preview appears here."}</p>
          </div>
        </div>
      )}

      {activePlatform === "LinkedIn" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">LinkedIn - Ether Studio</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">{content || "Your LinkedIn text preview appears here."}</p>
          {media && <div className="mt-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">{renderMedia(media, "h-40 w-full object-cover")}</div>}
        </div>
      )}

      {activePlatform === "Twitter / X" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-300">@ether_studio_ai</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
            {(content || "Your tweet preview appears here.").slice(0, 280)}
          </p>
          {hashtags.length > 0 && <p className="mt-2 text-xs font-semibold text-studio-primary">{hashtags.join(" ")}</p>}
        </div>
      )}

      {activePlatform === "YouTube" && (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="relative overflow-hidden bg-black">
            <img src={youtubeArtwork} alt="YouTube thumbnail preview" className="aspect-video w-full object-cover" />
            <span className="absolute bottom-3 right-3 rounded bg-black/80 px-2 py-1 text-[11px] font-semibold text-white">
              {media?.startsWith("data:video") ? "Video Ready" : "Thumbnail Preview"}
            </span>
          </div>
          <div className="flex gap-3 p-4">
            <div className="mt-1 h-10 w-10 shrink-0 rounded-full bg-red-600" />
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                {title || "Your video title"}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">Ether Studio AI • Preview</p>
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">
                {description || content || "Video description preview"}
              </p>
              {hashtags.length > 0 && (
                <p className="mt-3 text-xs font-semibold text-studio-primary">{hashtags.join(" ")}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostPreview;
