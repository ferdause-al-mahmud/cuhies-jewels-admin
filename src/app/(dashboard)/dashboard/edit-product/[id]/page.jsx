"use client";
import EditForm from "@/app/Components/Dashboard/EditProduct/EditForm";
import Loader from "@/app/Components/loader/Loader";
import { useEffect, useState } from "react";

const ProductPage = ({ params }) => {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/product/${params.id}`); // Fetch product data by ID
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          setError("Product not found");
        }
      } catch (error) {
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  if (loading) {
    return <Loader />;
  }
  console.log(product);
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="text-black">
      <h1 className="text-2xl font-bold mb-4  text-center">Edit Product</h1>
      <EditForm product={product} />
    </div>
  );
};

export default ProductPage;
