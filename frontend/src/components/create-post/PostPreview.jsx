function PostPreview({ content, media, platform, hashtags = [], onPlatformChange }) {
  const tabs = ["Instagram", "LinkedIn", "Twitter / X"];
  const activePlatform = tabs.includes(platform) ? platform : "Instagram";

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
              media.startsWith("data:video") ? (
                <video src={media} className="h-52 w-full object-cover" muted />
              ) : (
                <img src={media} alt="Preview media" className="h-52 w-full object-cover" />
              )
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
          {media && (
            <div className="mt-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
              {media.startsWith("data:video") ? (
                <video src={media} className="h-40 w-full object-cover" muted />
              ) : (
                <img src={media} alt="LinkedIn media" className="h-40 w-full object-cover" />
              )}
            </div>
          )}
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
    </div>
  );
}

export default PostPreview;

