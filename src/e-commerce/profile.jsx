import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Profile() {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
    loadUserOrders();
  }, []);

  const loadUserProfile = async () => {
    try {
      const stored = localStorage.getItem("auth");
      if (!stored) return navigate("/");

      const authData = JSON.parse(stored);

      if (!authData.userId) return navigate("/");

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, name, role, created_at")
        .eq("id", authData.userId)
        .single();

      if (userError || !userData) throw userError;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.userId)
        .single();

      setUserInfo({
        id: userData.id,
        email: userData.email,
        fullName: profileData?.full_name || userData.name,
        role: userData.role,
        joinedDate: new Date(userData.created_at).toLocaleDateString()
      });

    } catch (error) {
      console.error("Profile load error:", error);
      alert("Failed to load profile.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadUserOrders = async () => {
    try {
      const stored = localStorage.getItem("auth");
      if (!stored) return;

      const authData = JSON.parse(stored);

      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (name)
          )
        `)
        .eq("user_id", authData.userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedOrders = data.map(order => ({
        id: order.id,
        items: order.order_items?.length || 0,
        total: parseFloat(order.total),
        status: order.status,
        date: new Date(order.created_at).toLocaleDateString(),
        products: order.order_items?.map(item => item.products?.name).join(", ") || "N/A"
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/", { state: { openLogin: true } }); // ← AUTO OPEN LOGIN MODAL
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-green-100 text-green-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-teal-100 text-teal-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!userInfo) return <div>No profile found</div>;

  return (
   <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-orange-500 px-6 py-3 flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Tee-Shirt</h1>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-white hover:text-orange-100 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Shop
        </button>
      </header>

      {/* Profile Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-8 text-white">
                <div className="flex flex-col items-center">
                  {/* Avatar */}
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                    <span className="text-4xl font-bold text-orange-500">
                      {userInfo.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* User Info */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-1">{userInfo.fullName}</h2>
                    <p className="text-orange-100 text-sm mb-2">{userInfo.email}</p>
                    <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                      {userInfo.role.toUpperCase()} ACCOUNT
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                
                <div className="space-y-3">
                  {/* Email */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Email Address</p>
                      <p className="text-sm text-gray-900 font-medium">{userInfo.email}</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Full Name</p>
                      <p className="text-sm text-gray-900 font-medium">{userInfo.fullName}</p>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Member Since</p>
                      <p className="text-sm text-gray-900 font-medium">{userInfo.joinedDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Section */}
              <div className="px-6 pb-6 space-y-2">
                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">My Orders</h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-gray-500 text-lg mb-2">No orders yet</p>
                  <p className="text-gray-400 text-sm mb-4">Start shopping to see your orders here!</p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition"
                  >
                    Shop Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-sm text-gray-500">{order.date}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="border-t pt-3 mt-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Items</p>
                            <p className="font-medium">{order.items} item{order.items !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">Total</p>
                            <p className="font-bold text-orange-600 text-lg">₱ {order.total.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-1">Products:</p>
                          <p className="text-sm text-gray-700 line-clamp-1">{order.products}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact support at support@teecraft.com</p>
        </div>
      </main>
    </div>
  );
}
