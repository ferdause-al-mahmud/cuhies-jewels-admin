import AllProductsTable from "@/app/Components/Dashboard/AllProductsTable/AllProductsTable";
import ProductFilters from "@/app/Components/Dashboard/ProductFilters"; // Adjust path if needed

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Fetch products with search, type, and category params
const getProducts = async (
  page = 1,
  limit = 10,
  sortBy = "",
  search = "",
  category = "",
  type = ""
) => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
    if (sortBy) queryParams.append("sortBy", sortBy);
    if (search) queryParams.append("search", search);
    if (category) queryParams.append("category", category);
    if (type) queryParams.append("type", type);

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
    // Return default structure on error
    return { products: [], totalPages: 0, currentPage: 1 };
  }
};

const AllProducts = async ({ searchParams }) => {
  // Extract params safely
  const page = parseInt(searchParams?.page || "1");
  const sortBy = searchParams?.sortBy || "";
  const search = searchParams?.search || "";
  const category = searchParams?.category || "";
  const type = searchParams?.type || "";

  const data = await getProducts(page, 10, sortBy, search, category, type);

  const products = data?.products || [];
  const totalPages = data?.totalPages || 0;
  const currentPage = data?.currentPage || 1;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Products</h1>

      {/* 1. Add the Filter Component here */}
      <ProductFilters />

      {/* 2. Pass data to Table */}
      <AllProductsTable
        products={products}
        totalPages={totalPages}
        currentPage={currentPage}
        sortBy={sortBy}
      />
    </div>
  );
};

export default AllProducts;
