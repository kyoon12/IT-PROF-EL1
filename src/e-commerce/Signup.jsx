import { useState } from "react";
import { supabase } from "../supabase";

export default function Signup({ onClose, onSwitchToLogin, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        setError("User with this email already exists");
        setLoading(false);
        return;
      }

      // Create user directly in users table
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: email,
            password: password, // Note: In production, hash this!
            name: `${firstName} ${lastName}`,
            role: 'user'
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        setError(insertError.message || "Failed to create account");
        setLoading(false);
        return;
      }

      // Profile should be created automatically by the trigger
      // Wait a moment for the trigger
      await new Promise(resolve => setTimeout(resolve, 500));

      // Call the success callback
      onLoginSuccess({
        user: newUser.email,
        role: newUser.role,
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email
      });

      // Close the modal
      onClose();

    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-[420px] h-[500px] md:w-[800px] md:h-[600px] lg:w-[900px] lg:h-[650px] 
              bg-white
              flex overflow-hidden shadow-2xl rounded-lg">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-200 text-2xl font-bold"
        >
          ×
        </button>

        <div
          className="hidden md:block w-1/2"
          style={{
            backgroundImage: "url('/pic/model.png')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        ></div>

        <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gradient-to-tl from-orange-600 via-orange-400 to-amber-300 relative px-8">
          
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Sign Up</h2>

          <div className="w-64 md:w-72">
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-xs mb-3">
                {error}
              </div>
            )}

            <div className="bg-white rounded-lg px-4 py-3 mb-3 shadow">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-gray-700"
                placeholder="Email"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-white rounded-lg px-4 py-3 shadow">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-gray-700"
                  placeholder="First Name"
                  disabled={loading}
                />
              </div>
              <div className="flex-1 bg-white rounded-lg px-4 py-3 shadow">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-gray-700"
                  placeholder="Last Name"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg px-4 py-3 mb-3 shadow">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-gray-700"
                placeholder="Password (min. 6 characters)"
                disabled={loading}
              />
            </div>

            <div className="bg-white rounded-lg px-4 py-3 mb-6 shadow">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-gray-700"
                placeholder="Confirm Password"
                disabled={loading}
              />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold py-3 rounded-lg shadow mb-6 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <div className="flex items-center mb-4">
              <div className="flex-1 h-px bg-orange-600"></div>
              <span className="mx-3 text-sm text-gray-800">Or</span>
              <div className="flex-1 h-px bg-orange-600"></div>
            </div>

            <p className="text-xs text-gray-800 text-center">
              Already have an account?{" "}
              <button 
                type="button" 
                onClick={onSwitchToLogin} 
                className="underline font-semibold"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}