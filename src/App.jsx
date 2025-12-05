import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "./supabase";

import Landing from "./Landing/LandingPage.jsx";
import Login from "./e-commerce/Login.jsx";
import Signup from "./e-commerce/Signup.jsx";
import Dashboard from "./e-commerce/dashboard.jsx";
import Profile from "./e-commerce/profile.jsx";
import Cart from "./e-commerce/cart.jsx";
import Admin from "./admin/admin.jsx";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session);
      
      if (session) {
        await loadUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentRole(null);
        setIsAuthenticated(false);
        localStorage.removeItem("auth");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Session check error:", error);
        setLoading(false);
        return;
      }
      
      if (session) {
        await loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Session check error:", error);
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      // Add retry logic for profile fetch
      let attempts = 0;
      let profileData = null;
      let error = null;

      while (attempts < 3 && !profileData) {
        const result = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        profileData = result.data;
        error = result.error;

        if (error && attempts < 2) {
          console.log(`Profile fetch attempt ${attempts + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        } else {
          break;
        }
      }

      if (error) {
        console.error("Profile load error after retries:", error);
        // If profile doesn't exist, create it
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || 'User',
              role: 'user'
            }]);

          if (insertError && insertError.code !== '23505') {
            console.error("Profile creation error:", insertError);
          } else {
            // Try fetching again
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            
            profileData = newProfile;
          }
        }
      }

      if (profileData) {
        const role = profileData.role || 'user';
        const email = profileData.email || '';

        setCurrentUser(email);
        setCurrentRole(role);
        setIsAuthenticated(true);

        localStorage.setItem(
          "auth",
          JSON.stringify({
            user: email,
            role: role,
            isAuthenticated: true,
            userId: userId
          })
        );
      }
    } catch (error) {
      console.error("Profile load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = async ({ user, role, userId }) => {
    console.log("Login success:", { user, role, userId });
    
    setCurrentUser(user);
    setCurrentRole(role);
    setIsAuthenticated(true);

    localStorage.setItem(
      "auth",
      JSON.stringify({
        user,
        role,
        isAuthenticated: true,
        userId
      })
    );

    // Small delay to ensure state is set
    await new Promise(resolve => setTimeout(resolve, 100));

    // Redirect after login
    if (role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  // Protect routes
  const requireAuth = (element, requiredRole) => {
    if (loading) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="text-gray-600 text-lg">Loading...</div>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to landing");
      return <Navigate to="/" replace />;
    }

    // If role mismatch
    if (requiredRole && currentRole !== requiredRole) {
      console.log(`Role mismatch: required ${requiredRole}, current ${currentRole}`);
      return <Navigate to="/dashboard" replace />;
    }

    return element;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="text-gray-600 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing Page */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={currentRole === "admin" ? "/admin" : "/dashboard"} replace />
          ) : (
            <Landing onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={currentRole === "admin" ? "/admin" : "/dashboard"} replace />
          ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* Signup */}
      <Route
        path="/signup"
        element={
          isAuthenticated ? (
            <Navigate to={currentRole === "admin" ? "/admin" : "/dashboard"} replace />
          ) : (
            <Signup onLoginSuccess={handleLoginSuccess} />
          )
        }
      />

      {/* Dashboard (Authenticated: ANY ROLE) */}
      <Route
        path="/dashboard"
        element={requireAuth(<Dashboard />)}
      />

      {/* Profile */}
      <Route path="/profile" element={requireAuth(<Profile />)} />

      {/* Cart */}
      <Route path="/cart" element={requireAuth(<Cart />)} />

      {/* Admin (Admin ONLY) */}
      <Route
        path="/admin"
        element={requireAuth(<Admin />, "admin")}
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;