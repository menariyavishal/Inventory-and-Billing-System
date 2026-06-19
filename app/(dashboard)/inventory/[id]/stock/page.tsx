"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { addStock } from "@/lib/api/inventory";

export default function AddStockPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [imeiInput, setImeiInput] = useState(""); // text area for pasted IMEIs
  const [supplierName, setSupplierName] = useState("");
  const [costPrice, setCostPrice] = useState("");

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
      return;
    }
    loadProduct();
  }, [authLoading, role]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setProduct(data);
      setCostPrice(data.costPrice);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload: any = {
        supplierName,
        costPrice: parseFloat(costPrice) || undefined,
      };

      if (product.productType === "serialized") {
        const imeis = imeiInput
          .split(/[\n,]/)
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
          
        if (imeis.length === 0) {
          throw new Error("Please enter at least one IMEI");
        }
        payload.imeis = imeis;
      } else {
        payload.quantity = parseInt(quantity);
      }

      await addStock(parseInt(productId), payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
      setSubmitting(false);
    }
  };

  if (loading || authLoading) return <div className="text-center py-10">Loading...</div>;
  if (!product) return <div className="text-center py-10 text-red-500">Product not found</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2">Add Stock: {product.name}</h2>
      <div className="text-gray-500 mb-6 text-sm">
        Current Stock: {product.quantityInStock} | Type: {product.productType}
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {product.productType === "serialized" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              IMEI Numbers (Comma separated or one per line)
            </label>
            <textarea
              required
              rows={5}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. 359123456789012, 359123456789013"
              value={imeiInput}
              onChange={(e) => setImeiInput(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              Stock quantity will be calculated based on the number of IMEIs provided.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity to Add</label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Name (Optional)</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Cost Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Confirm Stock In"}
          </button>
        </div>
      </form>
    </div>
  );
}
