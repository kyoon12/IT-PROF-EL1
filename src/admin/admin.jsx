import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "Unisex",
    description: ""
  });

  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchUsers(), fetchOrders(), fetchProducts()]).finally(() => setLoading(false));
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (!error) setUsers(data || []);
  };

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*");
    if (!error) setOrders(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (!error) setProducts(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/"); 
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      // Create unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 9);
      const filename = `product_${timestamp}_${randomId}_${file.name}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("product_images")
        .upload(`products/${filename}`, file);

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("product_images")
        .getPublicUrl(`products/${filename}`);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.price || !imageFile) {
      alert("Please fill in all required fields including image");
      return;
    }

    try {
      // Upload image first
      const imageUrl = await uploadImage(imageFile);
      
      if (!imageUrl) {
        alert("Failed to upload image. Please try again.");
        return;
      }

      // Insert product with image URL
      const { data, error } = await supabase
        .from("products")
        .insert([
          {
            name: formData.name,
            price: parseFloat(formData.price),
            category: formData.category,
            image_url: imageUrl,
            description: formData.description,
            is_active: true
          }
        ])
        .select();

      if (error) throw error;

      alert("Product added successfully!");
      setFormData({
        name: "",
        price: "",
        category: "Unisex",
        description: ""
      });
      setImageFile(null);
      setImagePreview(null);
      setShowAddProductModal(false);
      await fetchProducts();
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

      if (error) throw error;
      alert("Product deleted successfully!");
      await fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const closeModal = () => {
    setShowAddProductModal(false);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      name: "",
      price: "",
      category: "Unisex",
      description: ""
    });
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

            {/* PRODUCTS BTN */}
            <button
              onClick={() => setActiveSection("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                activeSection === "products"
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span className="font-medium">Products</span>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

                {/* TOTAL PRODUCTS */}
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Total Products</p>
                      <p className="text-3xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
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
                                {u.name?.charAt(0)?.toUpperCase() || "U"}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{u.name}</span>
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

          {/* PRODUCTS SECTION */}
          {activeSection === "products" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                <button
                  onClick={() => setShowAddProductModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Product
                </button>
              </div>

              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <span className="font-medium text-gray-900">{p.name}</span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-gray-600">{p.category}</td>

                        <td className="px-6 py-4 font-semibold text-orange-600">
                          ₱ {parseFloat(p.price).toFixed(2)}
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-red-500 hover:text-red-700 font-medium text-sm"
                          >
                            Delete
                          </button>
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

      {/* ADD PRODUCT MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h3>

            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Classic White Tee"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₱) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 299"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Unisex</option>
                  <option>Men's</option>
                  <option>Women's</option>
                </select>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Image *
                </label>
                
                {/* File Input */}
                <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition bg-gray-50">
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-gray-600">
                      {imageFile ? imageFile.name : "Click to upload image"}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required
                  />
                </label>

                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Product description (optional)"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? "Uploading..." : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}