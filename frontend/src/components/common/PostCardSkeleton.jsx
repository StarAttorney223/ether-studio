function PostCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-[1.9rem] border border-gray-200 bg-white shadow-soft dark:border-gray-700 dark:bg-gray-800">
      <div className="h-44 w-full animate-pulse bg-slate-200 dark:bg-gray-700" />
      <div className="space-y-3 p-5">
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-gray-700" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-200 dark:bg-gray-700" />
        </div>
        <div className="h-7 w-3/4 animate-pulse rounded-xl bg-slate-200 dark:bg-gray-700" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-gray-700" />
          <div className="h-4 w-5/6 animate-pulse rounded-xl bg-slate-200 dark:bg-gray-700" />
          <div className="h-4 w-2/3 animate-pulse rounded-xl bg-slate-200 dark:bg-gray-700" />
        </div>
      </div>
    </article>
  );
}

export default PostCardSkeleton;
