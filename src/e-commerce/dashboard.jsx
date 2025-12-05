// src/e-commerce/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [favorites, setFavorites] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  
  const navigate = useNavigate();

  const availableColors = [
    { name: "White", hex: "#FFFFFF", border: true },
    { name: "Black", hex: "#000000" },
    { name: "Navy", hex: "#1E3A8A" },
    { name: "Gray", hex: "#6B7280" },
    { name: "Red", hex: "#DC2626" },
    { name: "Orange", hex: "#F97316" },
    { name: "Yellow", hex: "#FCD34D" },
    { name: "Green", hex: "#10B981" },
    { name: "Blue", hex: "#3B82F6" },
    { name: "Pink", hex: "#EC4899" },
  ];

  const availableSizes = ["XS", "S", "M", "L", "XL", "2XL"];
  const categories = ["All", "Men's", "Women's", "Unisex"];

  useEffect(() => {
    // Get user from localStorage
    const stored = localStorage.getItem("auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserId(parsed.userId);
      } catch (e) {
        console.error("Error parsing auth:", e);
      }
    }
    
    fetchProducts();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchFavorites();
      fetchCartCount();
    }
  }, [userId]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (error) throw error;
      setFavorites(data?.map(f => f.product_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchCartCount = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) throw error;
      const count = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(count);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((product) => product.category === activeCategory);

  const toggleFavorite = async (productId) => {
    if (!userId) {
      alert('Please login to add favorites');
      return;
    }

    try {
      const isFavorite = favorites.includes(productId);
      
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);

        if (error) throw error;
        setFavorites(favorites.filter(id => id !== productId));
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            product_id: productId
          });

        if (error) throw error;
        setFavorites([...favorites, productId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorites');
    }
  };

  const addToCart = (product) => {
    if (!userId) {
      alert('Please login to add items to cart');
      return;
    }
    setSelectedProduct(product);
    setSelectedColor("");
    setSelectedSize("");
  };

  const confirmAddToCart = async () => {
    if (!selectedColor) {
      alert("Please select a color");
      return;
    }
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }

    try {
      // Find variant
      const { data: variant, error: variantError } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', selectedProduct.id)
        .eq('color', selectedColor)
        .eq('size', selectedSize)
        .single();

      if (variantError) throw variantError;

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', selectedProduct.id)
        .eq('product_variant_id', variant.id)
        .single();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart')
          .insert({
            user_id: userId,
            product_id: selectedProduct.id,
            product_variant_id: variant.id,
            quantity: 1
          });

        if (error) throw error;
      }

      await fetchCartCount();
      setSelectedProduct(null);
      setSelectedColor("");
      setSelectedSize("");

      alert(`${selectedProduct.name} (${selectedColor}, ${selectedSize}) added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-orange-500 px-6 py-3 flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold">Tee-Shirt</h1>

        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/cart')}
            className="hover:opacity-80 transition relative"
          >
            <img src="/icons/cart.png" alt="Cart" className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="hover:opacity-80 transition"
          >
            <img src="/icons/acc.png" alt="User" className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Category Filters */}
      <div className="bg-white px-6 py-4 flex items-center justify-center gap-4 shadow-sm">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
              activeCategory === category
                ? "bg-orange-500 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <main className="px-6 py-5">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {activeCategory === "All" ? "All Products" : activeCategory}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {filteredProducts.length} product
            {filteredProducts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl"
                style={{ boxShadow: "0 4px 12px rgba(249,115,22,0.5)" }}
              >
                <div className="relative bg-gray-100 aspect-square overflow-hidden rounded-md transition-transform duration-300 hover:scale-105">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />

                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow"
                  >
                    <img
                      src={
                        favorites.includes(product.id)
                          ? "/icons/filled-heart.png"
                          : "/icons/heart.png"
                      }
                      alt="Favorite"
                      className="w-4 h-4"
                    />
                  </button>
                </div>

                <div className="p-3 bg-orange-50">
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[40px]">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-orange-600 font-bold text-sm">
                      ₱ {parseFloat(product.price).toFixed(2)}
                    </span>

                    <button 
                      onClick={() => addToCart(product)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 rounded font-medium transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
          </div>
        )}
      </main>

      {/* Color & Size Selection Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedProduct.name}</h3>
                <p className="text-orange-600 font-semibold">
                  ₱ {parseFloat(selectedProduct.price).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Color {selectedColor && `(${selectedColor})`}
              </label>
              <div className="grid grid-cols-5 gap-3">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(color.name)}
                    className={`relative w-full aspect-square rounded-lg transition-all ${
                      selectedColor === color.name
                        ? "ring-4 ring-orange-500 scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: color.hex,
                      border: color.border ? "2px solid #e5e7eb" : "none",
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
                      selectedSize === size
                        ? "bg-orange-500 text-white ring-2 ring-orange-500 scale-105"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={confirmAddToCart}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedColor || !selectedSize}
            >
              Add to Cart
            </button>

            {!selectedColor || !selectedSize ? (
              <p className="text-xs text-gray-500 text-center mt-2">
                Please select both color and size
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}