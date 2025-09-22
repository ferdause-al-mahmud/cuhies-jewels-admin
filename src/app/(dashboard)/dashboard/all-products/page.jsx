import AllProductsTable from "@/app/Components/Dashboard/AllProductsTable/AllProductsTable";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Fetch products on the server side (with pagination and sorting)
const getProducts = async (page = 1, limit = 10, sortBy = "") => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("page", page);
    queryParams.append("limit", limit);
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
const AllProducts = async ({ searchParams }) => {
  const page = parseInt(searchParams?.page || "1"); // Default to page 1
  const sortBy = searchParams?.sortBy || ""; // Default to no sorting

  const { products, totalPages, currentPage } = await getProducts(
    page,
    10,
    sortBy
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">All Products</h1>
      {/* Pass fetched products to AllProductsTable */}
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
