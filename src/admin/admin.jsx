import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchUsers(), fetchOrders()]).finally(() => setLoading(false));
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (!error) setUsers(data || []);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*");
    if (!error) setOrders(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); 
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="bg-orange-500 px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-white text-2xl font-bold">Admin Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-white text-orange-600 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition"
        >
          Logout
        </button>
      </header>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4 space-y-2">
            {/* DASHBOARD BTN */}
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "dashboard"
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            {/* USERS BTN */}
            <button
              onClick={() => setActiveSection("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "users"
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="font-medium">Users</span>
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6">
          {/* DASHBOARD SECTION */}
          {activeSection === "dashboard" && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>

              {/* TOP CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* TOTAL USERS */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Users</p>
                      <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                    </div>

                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* TOTAL ORDERS */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Orders</p>
                      <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                    </div>

                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* RECENT ORDERS */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders found</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">Order #{o.id}</p>
                          <p className="text-sm text-gray-500">{o.created_at?.split("T")[0]}</p>
                        </div>
                        <p className="text-right font-semibold text-gray-900">
                          ₱ {Number(o.total || 0).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* USERS SECTION */}
          {activeSection === "users" && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Joined
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="font-semibold text-orange-600">
                                {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{u.full_name}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-600">{u.email}</td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {u.created_at?.split("T")[0] || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
