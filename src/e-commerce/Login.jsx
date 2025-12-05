import { useState } from "react";
import { supabase } from "../supabase";

export default function Login({ onClose, onSwitchToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // Query user by email and password
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      // Login successful
      onLoginSuccess({ 
        user: data.email, 
        role: data.role,
        userId: data.id,
        name: data.name,
        email: data.email
      });
      
      onClose();
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-[900px] h-[90vh] max-h-[600px] bg-white flex overflow-hidden shadow-2xl rounded-lg">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 text-2xl font-bold"
        >
          ×
        </button>

        {/* LEFT SIDE IMAGE */}
        <div className="hidden md:flex w-1/2 bg-gray-100 items-center justify-center">
          <img 
            src="/pic/model.png"  
            className="w-full h-full object-cover"
            alt="Login Model"
          />
        </div>

        {/* RIGHT SIDE LOGIN FORM */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-tl from-orange-600 via-orange-400 to-amber-300 px-10 py-10">

          <div className="w-full max-w-sm space-y-6">

            {/* LOGIN TITLE */}
            <h2 className="text-3xl font-bold text-black text-center mb-4">
              Login
            </h2>

            {/* Error message */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* EMAIL INPUT */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">Email:</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-white rounded-full px-4 py-3 pr-12 outline-none text-sm text-gray-800 shadow-md"
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <img
                  src="/icons/acc.png"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7  rounded-full p-1.5"
                  alt=""
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">Password:</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white rounded-full px-4 py-3 pr-12 outline-none text-sm text-gray-800 shadow-md"
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <img
                  src="/icons/pass.png"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7  rounded-full p-1.5"
                  alt=""
                />
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-full shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-white/40"></div>
              <span className="text-xs text-white">Or</span>
              <div className="flex-1 h-px bg-white/40"></div>
            </div>

            {/* Test credentials hint */}
            <div className="bg-white/20 rounded-lg p-3 text-xs text-white">
              <p className="font-semibold mb-1">Test Credentials:</p>
              <p>Admin: admin@gmail.com / admin123</p>
            </div>

            {/* SIGNUP LINK */}
            <p className="text-xs text-white/90 text-center pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold underline text-white"
              >
                Sign Up
              </button>
            </p>

          </div>

        </div>
      </div>
    </div>
  );
}