import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
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

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) fetchCartItems();
  }, [userId]);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        const stored = localStorage.getItem("auth");
        if (stored) setUserId(JSON.parse(stored).userId);
        else navigate("/");
      } else setUserId(session.user.id);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/");
    }
  };

  const fetchCartItems = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cart")
        .select(`
          id,
          quantity,
          product_id,
          product_variant_id,
          products (
            id,
            name,
            price,
            image_url
          ),
          product_variants (
            id,
            color,
            size
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      const formattedItems = data.map((item) => ({
        cartId: item.id,
        id: item.products.id,
        name: item.products.name,
        price: parseFloat(item.products.price),
        image: item.products.image_url,
        color: item.product_variants.color,
        size: item.product_variants.size,
        quantity: item.quantity,
        variantId: item.product_variants.id,
        selected: true,
      }));

      setCartItems(formattedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      alert("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartId, delta) => {
    try {
      const item = cartItems.find((i) => i.cartId === cartId);
      const newQuantity = Math.max(1, item.quantity + delta);

      const { error } = await supabase
        .from("cart")
        .update({ quantity: newQuantity })
        .eq("id", cartId);

      if (error) throw error;

      setCartItems(
        cartItems.map((i) =>
          i.cartId === cartId ? { ...i, quantity: newQuantity } : i
        )
      );
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity");
    }
  };

  const removeItem = async (cartId) => {
    if (!confirm("Remove this item from cart?")) return;
    try {
      const { error } = await supabase.from("cart").delete().eq("id", cartId);
      if (error) throw error;
      setCartItems(cartItems.filter((item) => item.cartId !== cartId));
    } catch (error) {
      console.error("Error removing item:", error);
      alert("Failed to remove item");
    }
  };

  const clearCart = async () => {
    if (!confirm("Clear all items from cart?")) return;
    try {
      const { error } = await supabase.from("cart").delete().eq("user_id", userId);
      if (error) throw error;
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      alert("Failed to clear cart");
    }
  };

  const openEditModal = (item) => {
    setSelectedItemForEdit(item);
    setSelectedColor(item.color);
    setSelectedSize(item.size);
  };

  const saveEditChanges = async () => {
    if (!selectedColor || !selectedSize) return;
    try {
      // Fetch existing variant
      let { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", selectedItemForEdit.id)
        .eq("color", selectedColor)
        .eq("size", selectedSize)
        .single();

      if (variantError && variantError.code === "PGRST116") {
        // Create new variant if not exists
        const { data: newVariant, error: createError } = await supabase
          .from("product_variants")
          .insert({
            product_id: selectedItemForEdit.id,
            color: selectedColor,
            size: selectedSize,
            stock_quantity: 100,
          })
          .select()
          .single();

        if (createError) throw createError;
        variant = newVariant;
      } else if (variantError) {
        throw variantError;
      }

      // Check if cart already has this variant
      const { data: existingItem } = await supabase
        .from("cart")
        .select("*")
        .eq("user_id", userId)
        .eq("product_id", selectedItemForEdit.id)
        .eq("product_variant_id", variant.id)
        .single();

      if (existingItem && existingItem.id !== selectedItemForEdit.cartId) {
        // Merge quantities
        const { error: updateError } = await supabase
          .from("cart")
          .update({ quantity: existingItem.quantity + selectedItemForEdit.quantity })
          .eq("id", existingItem.id);
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from("cart")
          .delete()
          .eq("id", selectedItemForEdit.cartId);
        if (deleteError) throw deleteError;
      } else {
        // Update current cart item
        const { error } = await supabase
          .from("cart")
          .update({ product_variant_id: variant.id })
          .eq("id", selectedItemForEdit.cartId);
        if (error) throw error;
      }

      setSelectedItemForEdit(null);
      await fetchCartItems();
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
    }
  };

  const subtotal = parseFloat(
    cartItems
      .filter((item) => item.selected !== false)
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );

  const handleCheckout = async () => {
    const selectedItems = cartItems.filter((item) => item.selected !== false);

    if (!userId) {
      alert("You must be logged in to checkout");
      return;
    }

    if (selectedItems.length === 0) {
      alert("Please select items to checkout");
      return;
    }

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          total: subtotal,
          status: "pending",
        })
        .select()
        .single();
      if (orderError) throw orderError;

      const orderItems = selectedItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_variant_id: item.variantId,
        quantity: item.quantity,
        price: parseFloat(item.price.toFixed(2)),
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      if (itemsError) throw itemsError;

      const cartIds = selectedItems.map((item) => item.cartId);
      const { error: deleteError } = await supabase
        .from("cart")
        .delete()
        .in("id", cartIds);
      if (deleteError) throw deleteError;

      alert("Order placed successfully!");
      await fetchCartItems();
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to place order. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading cart...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <header className="bg-orange-500 px-6 py-3 flex items-center justify-between">
        <h1 className="text-white text-2xl font-bold min-w-[120px]">Tee-Shirt</h1>
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-white hover:text-orange-100 transition flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Continue Shopping
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="hover:opacity-80 transition"
          >
            <img src="/icons/acc.png" alt="User" className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Cart */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {cartItems.length > 0 && (
          <div className="bg-white p-4 mb-4 rounded-lg shadow flex items-center gap-4">
            <input
              type="checkbox"
              className="w-5 h-5"
              checked={cartItems.every((item) => item.selected !== false)}
              onChange={(e) =>
                setCartItems(
                  cartItems.map((item) => ({ ...item, selected: e.target.checked }))
                )
              }
            />
            <span className="font-medium text-gray-700">Select All</span>

            <button
              onClick={clearCart}
              className="ml-auto text-red-500 hover:text-red-600 text-sm"
            >
              Delete All
            </button>
          </div>
        )}

        {cartItems.length === 0 ? (
          <div className="bg-white p-10 rounded-xl shadow text-center">
            <h2 className="text-xl font-semibold mb-3">Your cart is empty</h2>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full"
            >
              Shop Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div
                key={item.cartId}
                className="bg-white p-4 rounded-lg shadow flex items-center gap-4"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={item.selected !== false}
                  onChange={(e) =>
                    setCartItems(
                      cartItems.map((c) =>
                        c.cartId === item.cartId
                          ? { ...c, selected: e.target.checked }
                          : c
                      )
                    )
                  }
                />

                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-md object-cover"
                />

                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.color} • {item.size}</p>
                  <button
                    className="text-orange-500 text-xs underline mt-1"
                    onClick={() => openEditModal(item)}
                  >
                    Edit
                  </button>
                  <p className="mt-1 font-bold text-orange-600 text-lg">
                    ₱ {item.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center border rounded-md overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.cartId, -1)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 1)}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.cartId)}
                  className="text-red-500 hover:text-red-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-white shadow-lg py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">Total:</span>
            <span className="text-xl font-bold text-orange-600">
              ₱ {subtotal.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium"
          >
            Checkout
          </button>
        </div>
      )}

      {selectedItemForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-[90%] max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <button
              onClick={() => setSelectedItemForEdit(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedItemForEdit.image}
                  alt={selectedItemForEdit.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  {selectedItemForEdit.name}
                </h3>
                <p className="text-orange-600 font-semibold">
                  ₱ {selectedItemForEdit.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Color ({selectedColor})
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
                      border: color.border ? "2px solid #ddd" : "none",
                    }}
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
              onClick={saveEditChanges}
              disabled={!selectedColor || !selectedSize}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-full shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
