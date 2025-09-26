import ProductsStockTable from "@/app/Components/Dashboard/ProductsStockTable/ProductsStockTable";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const categories = [
  // Clothing categories
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

  // accessories
  { value: "Rings", title: "Rings" },
  { value: "Watch", title: "Watch" },
  { value: "Mask-and-cap", title: "Mask and Cap" },
  { value: "Hijab", title: "Hijab" },
  { value: "Bracelete", title: "Bracelete" },
  // Winter categories

  { title: "Long-Coat", value: "Long-Coat" },
  { title: "Jacket", value: "Jacket" },
];

// Fetch products on the server side (with pagination and sorting)
const getProducts = async (
  page = 1,
  limit = 20,
  sortBy = "",
  category = ""
) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (category && category !== "all")
      queryParams.append("category", category);
    if (sortBy) queryParams.append("sortBy", sortBy);

    const apiUrlWithParams = `${apiUrl}/api/all-products?${queryParams.toString()}`;

    const res = await fetch(apiUrlWithParams, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch all products");
    }
    const products = await res.json();
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Main component that fetches the products and passes them to the table
const ProductsStock = async ({ searchParams }) => {
  const page = parseInt(searchParams?.page || "1"); // Default to page 1
  const sortBy = searchParams?.sortBy || ""; // Default to no sorting
  const category = searchParams?.category || ""; // Default to no sorting

  const { products, totalPages, currentPage } = await getProducts(
    page,
    20,
    sortBy,
    category
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Products</h1>
      {/* Pass fetched products to AllProductsTable */}
      <ProductsStockTable
        categories={categories}
        products={products}
        totalPages={totalPages}
        currentPage={currentPage}
        sortBy={sortBy}
      />
    </div>
  );
};

export default ProductsStock;
