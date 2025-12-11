"use client";
import { Pagination } from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation"; // Added useSearchParams, usePathname
import { AiFillDelete } from "react-icons/ai";
import Link from "next/link";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import toast from "react-hot-toast";

const AllProductsTable = ({ products, totalPages, currentPage, sortBy }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname(); // Gets the current path (e.g. /dashboard/all-products)

  // Handle page change while keeping existing filters
  const handlePageChange = (event, newPage) => {
    // 1. Create a clone of the current params
    const params = new URLSearchParams(searchParams);

    // 2. Update only the page parameter
    params.set("page", newPage);

    // 3. Push the new URL with all params intact
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle sort option change while keeping existing filters
  const handleSortChange = (event) => {
    const newSortOption = event.target.value;

    // 1. Create a clone of the current params
    const params = new URLSearchParams(searchParams);

    // 2. Update sort and reset page to 1
    params.set("sortBy", newSortOption);
    params.set("page", "1"); // Always reset to page 1 when sorting changes

    // 3. Push new URL
    router.push(`${pathname}?${params.toString()}`);
  };

  // Function to handle delete
  const handleDeleteProduct = (productId) => {
    confirmAlert({
      title: "Confirm to Delete",
      message: "Are you sure you want to delete this product?",
      buttons: [
        {
          label: "Yes",
          onClick: async () => {
            try {
              await fetch(`/api/product/${productId}`, {
                method: "DELETE",
              });
              toast.success("Product deleted successfully!");
              location.reload();
            } catch (error) {
              console.error("Error deleting product:", error);
              toast.error("Failed to delete product. Please try again.");
            }
          },
        },
        {
          label: "No",
          onClick: () => {},
        },
      ],
    });
  };

  return (
    <div>
      {/* <div className="mb-4"> */}
      {/* <label htmlFor="sort" className=" text-black font-bold mr-3">
          Sort by:
        </label> */}
      {/* <select
          id="sort"
          value={sortBy} // Use the prop directly, no need for local state
          onChange={handleSortChange}
          className="border border-gray-400 bg-[#242833] text-white p-2 rounded"
        >
          <option value="newest" className="bg-[#242833] text-white">
            Newest
          </option>
          <option value="oldest" className="bg-[#242833] text-white">
            Oldest
          </option>
        </select> */}
      {/* </div> */}

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Product ID</th>
            <th className="px-4 py-2 border">Product Image</th>
            <th className="px-4 py-2 border">Name</th>{" "}
            {/* Added Name Column helpful for search results */}
            <th className="px-4 py-2 border">Added Date</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products?.length > 0 ? (
            products.map((product) => (
              <tr key={product?.id}>
                <td className="px-4 py-2 border">{product?.id}</td>
                <td className="px-4 py-2 border">
                  <div className="flex items-center justify-center">
                    <Image
                      src={
                        product?.imageUrl
                          ? product?.imageUrl[0]
                          : product?.variants?.[0]?.images?.[0] ||
                            "/placeholder.jpg"
                      }
                      alt={`Product ${product?.id}`}
                      width={50}
                      height={50}
                      className="object-cover rounded"
                    />
                  </div>
                </td>
                <td className="px-4 py-2 border">{product?.name}</td>
                <td className="px-4 py-2 border">
                  {new Date(product?.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-2 border">
                  <div className="flex justify-center gap-2 items-center">
                    <Link
                      href={`/dashboard/edit-product/${product.id}`}
                      className="btn text-blue-500 cursor-pointer hover:underline"
                    >
                      Edit
                    </Link>
                    <div>
                      <AiFillDelete
                        onClick={() => handleDeleteProduct(product?.id)}
                        className="text-red-500 text-2xl cursor-pointer hover:scale-110 transition-transform"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-4">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-center items-center mt-6">
        <Pagination
          count={totalPages}
          page={Number(currentPage)} // Ensure this is a number
          onChange={handlePageChange}
          shape="rounded"
          color="primary"
          variant="outlined"
        />
      </div>
    </div>
  );
};

export default AllProductsTable;
