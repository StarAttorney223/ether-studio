import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const searchPlaceholders = {
  "/dashboard": "Search campaign, content or assets...",
  "/content-generator": "Search prompts, posts, or history...",
  "/image-generator": "Search your generations...",
  "/scheduler": "Search scheduled posts...",
  "/chatbot": "Search conversations...",
  "/create-post": "Search draft ideas, tags, or media...",
  "/profile": "Search account settings..."
};

function AppLayout() {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("studio-theme") === "dark");
  const placeholder = location.pathname.startsWith("/create-post")
    ? searchPlaceholders["/create-post"]
    : searchPlaceholders[location.pathname] || "Search...";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("studio-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-studio-bg transition-colors duration-300">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Sidebar />
        <main className="min-w-0">
          <Topbar
            placeholder={placeholder}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
          />
          <div className="p-4 sm:p-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
