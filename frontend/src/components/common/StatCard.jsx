function StatCard({ label, value, badge }) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-soft dark:border-gray-700 dark:bg-gray-800">
      <p className="inline-flex rounded-full bg-[#e8fbf0] px-2 py-1 text-xs font-semibold text-[#249d62] dark:bg-emerald-900/40 dark:text-emerald-300">{badge}</p>
      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{label}</p>
      <h3 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
    </article>
  );
}

export default StatCard;
