import { Bell, ChevronDown, CircleHelp, LogOut, Search, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getInitials } from "../../utils/avatar";

function Topbar({ placeholder, isDarkMode, onToggleDarkMode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="studio-topbar flex flex-wrap items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 transition-colors duration-300 dark:border-gray-700 dark:bg-gray-900 sm:px-7">
      <label className="studio-search flex h-11 min-w-[240px] flex-1 items-center gap-2 rounded-full bg-gray-100 px-4 text-gray-500 transition-colors duration-300 dark:bg-gray-800 dark:text-gray-300">
        <Search size={17} />
        <input
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
          placeholder={placeholder}
        />
      </label>
      <div className="ml-auto flex items-center gap-4 text-gray-600 dark:text-gray-300">
        <button
          onClick={onToggleDarkMode}
          className="studio-theme-switch relative h-9 w-[70px] rounded-full bg-[#8b8b8b] transition-all duration-300"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span
            className={`absolute top-1 h-7 w-7 rounded-full bg-white transition-all duration-300 ${
              isDarkMode ? "left-[35px]" : "left-1"
            }`}
          />
        </button>
        <button className="rounded-full p-2 transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-700">
          <Bell size={19} />
        </button>
        <button className="rounded-full p-2 transition-all duration-300 hover:scale-105 hover:bg-gray-100 dark:hover:bg-gray-700">
          <CircleHelp size={19} />
        </button>
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full p-1 transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-tr from-[#192341] to-[#8c9cff] text-sm font-semibold text-white">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">{user?.name || "Studio User"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-300">{user?.email || "Signed in"}</p>
            </div>
            <ChevronDown size={16} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-56 rounded-2xl border border-gray-200 bg-white p-2 shadow-soft dark:border-gray-700 dark:bg-gray-800">
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
              >
                <UserCircle size={16} />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
