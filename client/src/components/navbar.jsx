import { useAuth } from "../hooks/useAuth.jsx";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import Avatar from "./avatar.jsx";
import logo from "../assets/logo.svg";

export default function Navbar() {
  const { user, handleLogout } = useAuth();
  const [dropDown, setDropDown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropDown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function logout() {
    await handleLogout();
    navigate("/login");
  }

  return (
    <header className="w-full px-6 py-3 bg-white border-b border-zinc-200 flex items-center justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <img src={logo} alt="SixSecondCV" className="w-7 h-7" />
        <p className="text-sm font-bold text-zinc-800 tracking-tight">
          SixSecondCV
        </p>
      </div>

      {user ? (
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/resume")}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
          >
            My Resumes
          </button>
          <button
            onClick={() => navigate("/upload")}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
          >
            Match JD
          </button>
          <button
            onClick={() => navigate("/coldreach")}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
          >
            Outreach
          </button>
          <button
            onClick={() => navigate("/drafts")}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
          >
            Saved Drafts
          </button>

          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setDropDown((prev) => !prev)}
              className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
            >
              <Avatar username={user.username} email={user.email} />
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${dropDown ? "rotate-180" : ""}`}
              />
            </button>

            {dropDown && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-2.5"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
          >
            Log in
          </button>
          <button
            onClick={() => navigate("/register")}
            className="text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Get Started
          </button>
        </div>
      )}
    </header>
  );
}
