import { useState } from "react";
import Login from "../e-commerce/Login";
import Register from "../e-commerce/Signup";

export default function Landing({ onLoginSuccess }) {
  const [open, setOpen] = useState(null); // login | register | null

  return (
    <div className="min-h-screen bg-white">
      <div className="relative min-h-screen flex flex-col">

        {/* Page content */}
        <div className="relative z-10 flex flex-col min-h-screen">

          {/* HEADER WITH ORANGE BACKGROUND */}
          <header className="flex items-center justify-between px-6 sm:px-10 py-5 bg-gradient-to-tl from-orange-600 via-orange-400 to-amber-300">
            <div className="flex items-center gap-2">
              <img
                src="/pic/model.png"
                alt="TeeCraft logo"
                className="h-8 w-8 rounded-full object-cover border border-black/20"
              />
              <span className="text-lg sm:text-xl font-semibold tracking-tight text-white">
                TeeCraft
              </span>
            </div>

            <nav className="flex items-center gap-4 text-sm">
              <button
                onClick={() => setOpen("register")}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border border-white/50 bg-white/20 text-white hover:bg-white/30 transition"
              >
                Register
              </button>

              <button
                onClick={() => setOpen("login")}
                className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white text-orange-600 shadow-sm hover:bg-gray-100 transition"
              >
                Login
              </button>
            </nav>
          </header>

          {/* HERO SECTION */}
          <main className="flex-1 flex items-center justify-center bg-white">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 px-6 sm:px-10 py-10 max-w-6xl mx-auto">

              {/* LEFT TEXT */}
              <div className="flex flex-col justify-center text-left gap-4">
                <p className="text-orange-500 text-sm tracking-wide uppercase font-semibold">
                  Premium Tee Collection
                </p>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-black leading-tight">
                  The Perfect <br />
                  Everyday T-Shirt
                </h1>

                <p className="text-gray-600 text-base">
                  Soft. Minimal. Built for comfort. 
                  Discover our best-selling premium cotton tees designed for everyday wear.
                </p>
              </div>

              {/* RIGHT IMAGE */}
              <div className="flex justify-center items-center">
                <img
                  src="/pic/model.png"
                  alt="Premium T-Shirt"
                  className="w-full max-w-md object-contain rounded-xl shadow-lg border border-white/20 transition-transform hover:scale-105"
                />
              </div>

            </div>
          </main>

          {/* FOOTER */}
          <footer className="px-6 sm:px-10 py-4 flex items-center justify-between text-[11px] sm:text-xs text-gray-500">
            <span>© {new Date().getFullYear()} TeeCraft. All rights reserved.</span>
            <div className="hidden sm:flex items-center gap-4">
              <span>Crafted with comfort in mind.</span>
            </div>
          </footer>
        </div>
      </div>

      {/* MODALS */}
      {open === "login" && (
        <Login
          onClose={() => setOpen(null)}
          onSwitchToRegister={() => setOpen("register")}
          onLoginSuccess={onLoginSuccess}
        />
      )}

      {open === "register" && (
        <Register
          onClose={() => setOpen(null)}
          onSwitchToLogin={() => setOpen("login")}
          onLoginSuccess={onLoginSuccess}
        />
      )}
    </div>
  );
}
