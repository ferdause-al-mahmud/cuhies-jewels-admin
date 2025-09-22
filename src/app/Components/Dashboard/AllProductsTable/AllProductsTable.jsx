"use client";
import { Pagination } from "@mui/material";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AiFillDelete } from "react-icons/ai";
import Link from "next/link";
import { confirmAlert } from "react-confirm-alert"; // Import confirmAlert
import "react-confirm-alert/src/react-confirm-alert.css"; // Import styles
import toast from "react-hot-toast";

const AllProductsTable = ({ products, totalPages, currentPage, sortBy }) => {
  const [page, setPage] = useState(currentPage || 1);
  const [sortOption, setSortOption] = useState(sortBy || "");
  const router = useRouter();

  // Handle page change and update the URL
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    router.push(`/dashboard/all-products?page=${newPage}&sortBy=${sortOption}`);
  };

  // Handle sort option change
  const handleSortChange = (event) => {
    const newSortOption = event.target.value;
    setSortOption(newSortOption);
    setPage(1);
    router.push(`/dashboard/all-products?page=1&sortBy=${newSortOption}`);
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
              // Optionally, refresh the products list or redirect
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
      <div className="mb-4">
        <label htmlFor="sort" className=" text-black font-bold mr-3">
          Sort by:
        </label>
        <select
          id="sort"
          value={sortOption}
          onChange={handleSortChange}
          className="border border-gray-400 bg-[#242833] text-white p-2 rounded"
        >
          <option value="newest" className="bg-[#242833] text-white">
            Newest
          </option>
          <option value="oldest" className="bg-[#242833] text-white">
            Oldest
          </option>
        </select>
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Product ID</th>
            <th className="px-4 py-2 border">Product Image</th>
            <th className="px-4 py-2 border">Added Date</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products?.map((product) => (
            <tr key={product?.id}>
              <td className="px-4 py-2 border">{product?.id}</td>
              <td className="px-4 py-2 border">
                <div className="flex items-center justify-center">
                  <Image
                    src={
                      product?.imageUrl
                        ? product?.imageUrl[0]
                        : product?.variants[0]?.images[0]
                    }
                    alt={`Product ${product?.id}`}
                    width={50}
                    height={50}
                  />
                </div>
              </td>
              <td className="px-4 py-2 border">
                {new Date(product?.createdAt).toLocaleDateString("en-GB")}
              </td>
              <td className="px-4 py-2 border">
                <div className="flex justify-center gap-2 items-center">
                  <Link
                    href={`/dashboard/edit-product/${product.id}`}
                    className="btn text-blue-500 cursor-pointer"
                  >
                    Edit
                  </Link>
                  <div>
                    <AiFillDelete
                      onClick={() => handleDeleteProduct(product?.id)}
                      className="text-red-500 text-2xl cursor-pointer hover:scale-110"
                    />
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-center items-center mt-6">
        <Pagination
          count={totalPages}
          page={page}
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
