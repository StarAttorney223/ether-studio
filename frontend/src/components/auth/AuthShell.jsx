function AuthShell({ title, subtitle, children, asideTitle, asideText }) {
  return (
    <div className="min-h-screen bg-studio-bg px-4 py-8 transition-colors duration-300 sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-soft dark:border-gray-700 dark:bg-gray-800 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between bg-gradient-to-br from-[#21113f] via-[#5e2de5] to-[#9a79ff] p-8 text-white sm:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">Ether Studio</p>
            <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight sm:text-5xl">{asideTitle}</h1>
            <p className="mt-4 max-w-lg text-sm text-white/85 sm:text-base">{asideText}</p>
          </div>
          <div className="rounded-[1.7rem] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm font-semibold">Ship content like a real SaaS team</p>
            <p className="mt-2 text-sm text-white/80">
              Draft, schedule, publish, and now manage your profile from one consistent workspace.
            </p>
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10">
          <div className="w-full">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">{subtitle}</p>
            </div>
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthShell;
