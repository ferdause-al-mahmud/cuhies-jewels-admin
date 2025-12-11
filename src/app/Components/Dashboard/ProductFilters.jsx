"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

// --- 1. Define Categories (Same as your ProductForm) ---
const winterCategories = [{ title: "Long-Coat" }, { title: "Jacket" }];

const clothingCategories = [
  { value: "Saree", title: "Saree" },
  { value: "Kurti", title: "Kurti" },
  { value: "Gown", title: "Gown" },
  { value: "Kaftan", title: "Kaftan" },
  { value: "Cordset", title: "Co-ords set" },
  { value: "Payjamas", title: "Payjamas" },
  { value: "Two-piece", title: "Two Piece" },
  { value: "Three-piece", title: "Three Piece" },
  { value: "One-piece", title: "One Piece" },
  { value: "Shirts", title: "Shirts" },
];

const accessoriesCategories = [
  { value: "Rings", title: "Rings" },
  { value: "Watch", title: "Watch" },
  { value: "Mask-and-cap", title: "Mask and Cap" },
  { value: "Hijab", title: "Hijab" },
  { value: "Bracelete", title: "Bracelete" },
];

const cjMenCategories = [
  { value: "watches", title: "Mens Watches" },
  { value: "wallets", title: "Mens Wallets" },
  { value: "mens-bags-and-shoes", title: "Mens Bags and Shoes" },
  { value: "mens-perfumes", title: "Mens Perfumes" },
  { value: "apparels", title: "Mens Apparels" },
];

// Combine them all into one list
const allCategories = [
  ...winterCategories,
  ...clothingCategories,
  ...accessoriesCategories,
  { title: "Bags & Shoes", value: "bags-and-shoes" },
  { title: "Perfumes", value: "perfumes" },
  ...cjMenCategories,
];

const ProductFilters = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      handleFilterChange("search", searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  const typeOptions = [
    "Normal",
    "Featured",
    "Trending",
    "CJ-Originals",
    "New",
    "Sale",
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Search Product
          </label>
          <input
            type="text"
            placeholder="Search by Name or ID..."
            className="border p-2 rounded w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter - Updated with your categories */}
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Category
          </label>
          <select
            className="border p-2 rounded w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleFilterChange("category", e.target.value)}
            value={searchParams.get("category") || ""}
          >
            <option value="">All Categories</option>
            {allCategories.map((cat, index) => {
              // Some categories only have a title (like Winter), others have value & title.
              // We use value if present, otherwise title.
              const optionValue = cat.value || cat.title;
              return (
                <option key={index} value={optionValue}>
                  {cat.title}
                </option>
              );
            })}
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Type
          </label>
          <select
            className="border p-2 rounded w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleFilterChange("type", e.target.value)}
            value={searchParams.get("type") || ""}
          >
            <option value="">All Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t mt-2">
        <div className="w-full md:w-48">
          <select
            className="border p-2 rounded w-full bg-white text-sm"
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            value={searchParams.get("sortBy") || ""}
          >
            <option value="">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="price_low">Sort: Price Low to High</option>
            <option value="price_high">Sort: Price High to Low</option>
          </select>
        </div>

        <button
          onClick={() => {
            setSearchTerm("");
            replace(pathname);
          }}
          className="text-red-500 text-sm font-medium hover:text-red-700 hover:underline transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilters;
