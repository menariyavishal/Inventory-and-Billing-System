"use client";

import { useState, useEffect } from "react";
import { getCategories, createCategory, createProduct } from "@/lib/api/inventory";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function NewProductPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    productType: "quantity",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "5",
    initialQuantity: "0",
    imeis: "",
    supplierName: "",
    imageUrl: "",
  });

  const [imageSourceType, setImageSourceType] = useState<"file" | "url">("file");
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [newCatName, setNewCatName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
    }
    loadCategories();
  }, [authLoading, role]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      const cat = await createCategory({ name: newCatName });
      setCategories([...categories, cat]);
      setFormData({ ...formData, categoryId: cat.id.toString() });
      setNewCatName("");
      setIsAddingCategory(false);
    } catch (err) {
      setError("Failed to create category");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (value: string) => {
    setFormData({ ...formData, imageUrl: value });
  };

  const handleClearImage = () => {
    setFormData({ ...formData, imageUrl: "" });
    setFileInputKey(Date.now());
  };

  const handleThresholdChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, ""); // Remove all non-digits
    setFormData({ ...formData, lowStockThreshold: cleanValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const threshold = parseInt(formData.lowStockThreshold) || 0;
    if (threshold <= 0) {
      setError("Low Stock Threshold must be a positive number.");
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        categoryId: formData.categoryId,
        name: formData.name,
        brand: formData.brand,
        productType: formData.productType,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        lowStockThreshold: threshold,
        initialQuantity: formData.productType === "quantity" ? parseInt(formData.initialQuantity) || 0 : 0,
        imeis: formData.productType === "serialized" ? formData.imeis.split(",").map(i => i.trim()).filter(Boolean) : [],
        supplierName: formData.supplierName || undefined,
        imageUrl: formData.imageUrl || undefined,
      };

      await createProduct(payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      setLoading(false);
    }
  };

  if (authLoading || role !== "owner") return null;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 font-sans text-gray-800 border-b pb-3">Add New Product</h2>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded border border-red-100 font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Product Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Brand</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
          {isAddingCategory ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New Category Name"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-bold"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="text-gray-600 hover:text-gray-900 px-2 font-bold"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                required
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm border border-gray-300 font-bold"
              >
                + New
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">Product Type</label>
          <select
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
          >
            <option value="quantity">Quantity Based (e.g. Chargers, Cables)</option>
            <option value="serialized">Serialized (e.g. Mobile Phones with IMEIs)</option>
          </select>
        </div>

        {/* Product Image Section */}
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50/50">
          <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
          <div className="flex gap-4 mb-3">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                imageSourceType === "file"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setImageSourceType("file")}
            >
              Upload Local Image
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                imageSourceType === "url"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setImageSourceType("url")}
            >
              Image URL
            </button>
          </div>

          <div className="flex items-center gap-4">
            {formData.imageUrl ? (
              <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden bg-white flex items-center justify-center group shadow-sm">
                <img
                  src={formData.imageUrl}
                  alt="Product preview"
                  className="object-contain w-full h-full"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-100/50 text-gray-400 text-xs">
                No Image
              </div>
            )}

            <div className="flex-1">
              {imageSourceType === "file" ? (
                <div>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 file:hover:bg-blue-100 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Supports JPG, PNG, WEBP (Max 5MB)</span>
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.imageUrl.startsWith("data:") ? "" : formData.imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Cost Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Selling Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
            />
          </div>
        </div>

        {/* Initial Stock Setup Field */}
        <div className="border-t pt-4 mt-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Initial Stock Setup</h3>
          {formData.productType === "quantity" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.initialQuantity}
                  onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lalit Distributor"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Initial IMEIs (Comma Separated)</label>
                <textarea
                  placeholder="e.g. 866365081122723, 866365081122724"
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.imeis}
                  onChange={(e) => setFormData({ ...formData, imeis: e.target.value })}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">Separate multiple IMEI numbers with commas. The initial stock will count the number of entered IMEIs.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lalit Distributor"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.supplierName}
                  onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">Low Stock Threshold</label>
          <input
            type="text"
            required
            placeholder="e.g. 5"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.lowStockThreshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
