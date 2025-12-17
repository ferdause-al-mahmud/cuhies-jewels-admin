"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";

import dynamic from "next/dynamic";
import { optimizeImage } from "@/app/utils/imageOptimization";

const JoditEditor = dynamic(
  () => import("jodit-react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="border p-2 w-full rounded h-40">Loading editor...</div>
    ),
  }
);

const winterCategories = [{ title: "Long-Coat" }, { title: "Jacket" }];
const types = [
  { title: "Normal" },
  { title: "Featured" },
  { title: "Trending" },
  { title: "CJ-Originals" },
  { title: "New" },
  { title: "Sale" },
];

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

const EditForm = ({ product }) => {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: 0,
    offerPercentage: 0,
    offerPrice: 0,
    buyingPrice: 0,
    description: "",
    category: "",
    subcategory: "",
    type: [],
    sizeType: "individual",
    globalMeasurements: {
      availableSizes: [
        { size: "SM", measurements: "" },
        { size: "S", measurements: "" },
        { size: "M", measurements: "" },
        { size: "L", measurements: "" },
        { size: "XL", measurements: "" },
        { size: "XXL", measurements: "" },
      ],
      freeSize: { measurements: "" },
    },
    variants: [
      {
        name: "",
        productId: "",
        colorCode: "",
        images: [],
        availableSizes: [
          { size: "SM", availability: 0 },
          { size: "S", availability: 0 },
          { size: "M", availability: 0 },
          { size: "L", availability: 0 },
          { size: "XL", availability: 0 },
          { size: "XXL", availability: 0 },
        ],
        freeSize: { availability: 0 },
        noSize: { availability: 0 },
      },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const editor = useRef(null);

  useEffect(() => {
    if (product) {
      let variants = [];
      let globalMeasurements = {
        availableSizes: [],
        freeSize: { measurements: "" },
      };

      if (product.variants && Array.isArray(product.variants)) {
        variants = product.variants.map((variant) => ({
          name: variant.name || "",
          productId: variant.productId || "",
          colorCode: variant.colorCode || "",
          images: variant.images || [],
          availableSizes: variant.availableSizes || [],
          freeSize: variant.freeSize || { availability: 0 },
          noSize: variant.noSize || { availability: 0 },
        }));
      } else if (product.colors) {
        variants = product.colors.map((color) => {
          const variant = {
            name: color.name || "",
            productId: color.productId || "",
            colorCode: color.color || color.Color || "",
            images: [],
            availableSizes: [],
            freeSize: { availability: 0 },
            noSize: { availability: 0 },
          };

          if (
            product.sizeType === "individual" ||
            (!product.sizeType && product.availableSizes)
          ) {
            if (product.category === "shoes") {
              variant.availableSizes = product.availableSizes?.map((size) => ({
                size: size.size,
                availability: size.availability || 0,
              })) || [{ size: "", availability: 0 }];
            } else {
              const defaultSizes = ["SM", "S", "M", "L", "XL", "XXL"];
              variant.availableSizes = defaultSizes.map((sizeLabel) => {
                const found = product.availableSizes?.find(
                  (ps) => ps.size === sizeLabel
                );
                return {
                  size: sizeLabel,
                  availability: found?.availability || 0,
                };
              });
            }
          } else if (product.sizeType === "free" || product.freeSize) {
            variant.freeSize = {
              availability: product.freeSize?.availability || 0,
            };
          } else if (product.sizeType === "none" || product.noSize) {
            variant.noSize = {
              availability: product.noSize?.availability || 0,
            };
          }

          return variant;
        });
      } else {
        variants = [
          {
            name: "",
            productId: "",
            colorCode: "",
            images: [],
            availableSizes: [
              { size: "SM", availability: 0 },
              { size: "S", availability: 0 },
              { size: "M", availability: 0 },
              { size: "L", availability: 0 },
              { size: "XL", availability: 0 },
              { size: "XXL", availability: 0 },
            ],
            freeSize: { availability: 0 },
            noSize: { availability: 0 },
          },
        ];
      }

      if (product.globalMeasurements) {
        globalMeasurements = {
          availableSizes: product.globalMeasurements.availableSizes || [],
          freeSize: product.globalMeasurements.freeSize || { measurements: "" },
        };
      } else if (product.availableSizes) {
        if (product.category === "shoes") {
          globalMeasurements.availableSizes = product.availableSizes.map(
            (size) => ({
              size: size.size,
              measurements: size.measurements || "",
            })
          );
        } else {
          const defaultSizes = ["SM", "S", "M", "L", "XL", "XXL"];
          globalMeasurements.availableSizes = defaultSizes.map((sizeLabel) => {
            const found = product.availableSizes.find(
              (ps) => ps.size === sizeLabel
            );
            return {
              size: sizeLabel,
              measurements: found?.measurements || "",
            };
          });
        }
      } else {
        globalMeasurements = {
          availableSizes: [
            { size: "SM", measurements: "" },
            { size: "S", measurements: "" },
            { size: "M", measurements: "" },
            { size: "L", measurements: "" },
            { size: "XL", measurements: "" },
            { size: "XXL", measurements: "" },
          ],
          freeSize: { measurements: "" },
        };
      }

      if (product.freeSize) {
        globalMeasurements.freeSize = {
          measurements: product.freeSize.measurements || "",
        };
      }

      let sizeType = "individual";
      if (product.sizeType) {
        sizeType = product.sizeType;
      } else if (product.freeSize) {
        sizeType = "free";
      } else if (product.noSize) {
        sizeType = "none";
      }

      setFormData({
        ...product,
        sizeType,
        globalMeasurements,
        variants,
        ...(product.imageUrl &&
          variants.length > 0 && {
            variants: variants.map((variant, index) =>
              index === 0
                ? {
                    ...variant,
                    images: [
                      ...(variant.images || []),
                      ...(Array.isArray(product.imageUrl)
                        ? product.imageUrl
                        : [product.imageUrl]),
                    ],
                  }
                : variant
            ),
          }),
      });
    }
  }, [product]);

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...(formData.variants || [])];
    updatedVariants[index][field] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const addVariant = () => {
    const newVariant = {
      name: "",
      productId: "",
      colorCode: "",
      images: [],
      availableSizes: [],
      freeSize: { availability: 0 },
      noSize: { availability: 0 },
    };

    if (formData.sizeType === "individual") {
      if (formData.category === "shoes") {
        newVariant.availableSizes = [{ size: "", availability: 0 }];
      } else {
        newVariant.availableSizes = [
          { size: "SM", availability: 0 },
          { size: "S", availability: 0 },
          { size: "M", availability: 0 },
          { size: "L", availability: 0 },
          { size: "XL", availability: 0 },
          { size: "XXL", availability: 0 },
        ];
      }
    }

    setFormData({
      ...formData,
      variants: [...(formData.variants || []), newVariant],
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const uploadImagesToServer = async (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await axios.post(
      "https://admin.cuhiesjewels.com.bd/api/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.files; // [{ url, fileName }]
  };

  const handleVariantImageUpload = async (variantIndex, e) => {
    const files = e.target.files;
    setLoading(true);
    setImageError("");

    try {
      const optimizedFiles = await Promise.all(
        [...files].map(async (file) => {
          try {
            return await optimizeImage(file);
          } catch (error) {
            console.error("Error optimizing image:", error);
            return file;
          }
        })
      );

      const uploadedImages = await uploadImagesToServer(optimizedFiles);
      const urls = uploadedImages.map((img) => img.url);

      const updatedVariants = [...formData.variants];
      updatedVariants[variantIndex].images = [
        ...(updatedVariants[variantIndex].images || []),
        ...urls,
      ];

      setFormData({ ...formData, variants: updatedVariants });
    } catch (error) {
      console.error("Image upload error:", error);
      setImageError("Image upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[variantIndex].images = updatedVariants[
      variantIndex
    ].images.filter((_, i) => i !== imageIndex);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleGlobalMeasurementChange = (sizeIndex, value) => {
    const updatedMeasurements = { ...formData.globalMeasurements };
    updatedMeasurements.availableSizes[sizeIndex].measurements = value;
    setFormData({ ...formData, globalMeasurements: updatedMeasurements });
  };

  const handleGlobalFreeSizeMeasurementChange = (value) => {
    const updatedMeasurements = { ...formData.globalMeasurements };
    updatedMeasurements.freeSize.measurements = value;
    setFormData({ ...formData, globalMeasurements: updatedMeasurements });
  };

  const handleVariantSizeChange = (variantIndex, sizeIndex, value) => {
    const updatedVariants = [...formData.variants];
    const numValue = value === "" ? 0 : Number(value);
    updatedVariants[variantIndex].availableSizes[sizeIndex].availability =
      numValue < 0 ? 0 : numValue;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleVariantFreeSizeChange = (variantIndex, value) => {
    const updatedVariants = [...formData.variants];
    const numValue = value === "" ? 0 : Number(value);
    updatedVariants[variantIndex].freeSize.availability =
      numValue < 0 ? 0 : numValue;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleVariantNoSizeChange = (variantIndex, value) => {
    const updatedVariants = [...formData.variants];
    const numValue = value === "" ? 0 : Number(value);
    updatedVariants[variantIndex].noSize.availability =
      numValue < 0 ? 0 : numValue;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]:
          name === "price" || name === "offerPercentage"
            ? Number.parseFloat(value) || ""
            : value,
      };

      if (name === "price" || name === "offerPercentage") {
        const price = Number.parseFloat(updatedData.price) || 0;
        const offerPercentage =
          Number.parseFloat(updatedData.offerPercentage) || 0;

        if (price > 0 && offerPercentage > 0) {
          const discountAmount = (price * offerPercentage) / 100;
          updatedData.offerPrice = (price - discountAmount).toFixed(2);
        } else {
          updatedData.offerPrice = "";
        }
      }

      if (name === "category" && !["Pants", "Joggers"].includes(value)) {
        updatedData.subcategory = "";
      }

      if (name === "sizeType") {
        const updatedVariants = [...(prevData.variants || [])];

        updatedVariants.forEach((variant) => {
          if (value === "individual") {
            if (prevData.category === "shoes") {
              variant.availableSizes = [{ size: "", availability: 0 }];
            } else {
              variant.availableSizes = [
                { size: "SM", availability: 0 },
                { size: "S", availability: 0 },
                { size: "M", availability: 0 },
                { size: "L", availability: 0 },
                { size: "XL", availability: 0 },
                { size: "XXL", availability: 0 },
              ];
            }
            variant.freeSize = { availability: 0 };
            variant.noSize = { availability: 0 };
          } else if (value === "free") {
            variant.freeSize = { availability: 0 };
            variant.noSize = { availability: 0 };
            variant.availableSizes = [];
          } else if (value === "none") {
            variant.noSize = { availability: 0 };
            variant.freeSize = { availability: 0 };
            variant.availableSizes = [];
          }
        });

        updatedData.variants = updatedVariants;

        if (value === "individual") {
          if (prevData.category === "shoes") {
            updatedData.globalMeasurements = {
              ...updatedData.globalMeasurements,
              availableSizes: [{ size: "", measurements: "" }],
            };
          } else {
            updatedData.globalMeasurements = {
              ...updatedData.globalMeasurements,
              availableSizes: [
                { size: "SM", measurements: "" },
                { size: "S", measurements: "" },
                { size: "M", measurements: "" },
                { size: "L", measurements: "" },
                { size: "XL", measurements: "" },
                { size: "XXL", measurements: "" },
              ],
            };
          }
        }
      }

      if (name === "category" && updatedData.sizeType === "individual") {
        const updatedVariants = [...(updatedData.variants || [])];

        if (value === "shoes") {
          updatedVariants.forEach((variant) => {
            variant.availableSizes = [{ size: "", availability: 0 }];
          });
          updatedData.globalMeasurements = {
            ...updatedData.globalMeasurements,
            availableSizes: [{ size: "", measurements: "" }],
          };
        } else if (prevData.category === "shoes") {
          updatedVariants.forEach((variant) => {
            variant.availableSizes = [
              { size: "SM", availability: 0 },
              { size: "S", availability: 0 },
              { size: "M", availability: 0 },
              { size: "L", availability: 0 },
              { size: "XL", availability: 0 },
              { size: "XXL", availability: 0 },
            ];
          });
          updatedData.globalMeasurements = {
            ...updatedData.globalMeasurements,
            availableSizes: [
              { size: "SM", measurements: "" },
              { size: "S", measurements: "" },
              { size: "M", measurements: "" },
              { size: "L", measurements: "" },
              { size: "XL", measurements: "" },
              { size: "XXL", measurements: "" },
            ],
          };
        }

        updatedData.variants = updatedVariants;
      }

      return updatedData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const { _id, globalMeasurements, variants, ...dataToUpdate } = formData;

    const finalData = {
      ...dataToUpdate,
      globalMeasurements,
      variants: variants.map((variant) => ({
        name: variant.name,
        productId: variant.productId,
        colorCode: variant.colorCode,
        images: variant.images || [],
        availableSizes: variant.availableSizes || [],
        freeSize: variant.freeSize || { availability: 0 },
        noSize: variant.noSize || { availability: 0 },
      })),
    };

    try {
      await axios.put(`/api/product/${formData.id}`, finalData);
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Update error:", error.response?.data || error.message);
      toast.error(
        error.response?.data?.message ||
          "Error updating product. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  console.log(formData);

  const allCategories = [
    ...winterCategories,
    ...clothingCategories,
    ...accessoriesCategories,
    { title: "Bags & Shoes", value: "bags-and-shoes" },
    { title: "Perfumes", value: "perfumes" },
    ...cjMenCategories,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block font-bold mb-2">Product ID</label>
        <input
          type="text"
          name="id"
          value={formData.id || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Enter product ID"
          required
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Product Name</label>
        <input
          type="text"
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Enter product name"
          required
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Price</label>
        <input
          type="number"
          onWheel={(e) => e.target.blur()}
          name="price"
          value={formData.price || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Enter product price"
          required
          min="0"
        />
      </div>
      <div>
        <label className="block font-bold mb-2">Buying Price</label>
        <input
          type="number"
          onWheel={(e) => e.target.blur()}
          name="buyingPrice"
          value={formData.buyingPrice || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Enter product Buying Price"
          required
          min="0"
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Offer Percentage (%)</label>
        <input
          type="number"
          onWheel={(e) => e.target.blur()}
          name="offerPercentage"
          value={formData.offerPercentage || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Enter offer percentage"
          min="0"
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Final Offer Price</label>
        <input
          type="number"
          onWheel={(e) => e.target.blur()}
          name="offerPrice"
          value={formData.offerPrice || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Calculated offer price"
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Description</label>
        <JoditEditor
          ref={editor}
          value={formData.description || ""}
          onChange={(newContent) => {
            setFormData({
              ...formData,
              description: newContent,
            });
          }}
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Category</label>
        <select
          name="category"
          value={formData.category || ""}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          required
        >
          <option value="">Select Category</option>
          {allCategories.map((category, index) => (
            <option key={index} value={category.value || category.title}>
              {category.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-bold mb-2">Type</label>
        <div className="border p-2 rounded w-full bg-white">
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.type?.map((selectedType, index) => (
              <span
                key={index}
                className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
              >
                {selectedType}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: formData.type.filter((t) => t !== selectedType),
                    });
                  }}
                  className="text-red-500 font-bold hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {types.map((type, index) => {
              const isSelected = formData.type.includes(type.title);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setFormData({
                        ...formData,
                        type: formData.type.filter((t) => t !== type.title),
                      });
                    } else {
                      setFormData({
                        ...formData,
                        type: [...formData.type, type.title],
                      });
                    }
                  }}
                  className={`p-2 rounded border ${
                    isSelected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <label className="block font-bold mb-2">Size Type</label>
        <select
          name="sizeType"
          value={formData.sizeType || "individual"}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          required
        >
          <option value="individual">Individual Size (S, M, L, etc.)</option>
          <option value="free">Free Size (One size fits all)</option>
          <option value="none">No Size (No size selection needed)</option>
        </select>
      </div>

      {(formData.sizeType === "individual" || formData.sizeType === "free") && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="font-bold mb-4 text-blue-800">
            Global Measurements (Applied to All Variants)
          </h2>

          {formData.sizeType === "individual" && (
            <div>
              <h3 className="font-semibold mb-2">Size Measurements</h3>
              {formData.category === "shoes" ? (
                <div className="space-y-2">
                  {formData.globalMeasurements.availableSizes.map(
                    (sizeObj, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-1/4">
                          <input
                            type="text"
                            placeholder="Size (e.g. 38, 39-40)"
                            value={sizeObj.size}
                            onChange={(e) => {
                              const updatedMeasurements = {
                                ...formData.globalMeasurements,
                              };
                              updatedMeasurements.availableSizes[index].size =
                                e.target.value;
                              setFormData({
                                ...formData,
                                globalMeasurements: updatedMeasurements,
                              });
                            }}
                            className="border p-2 rounded bg-white w-full"
                          />
                        </div>
                        <div className="w-2/3">
                          <input
                            type="text"
                            placeholder="Measurements (optional)"
                            value={sizeObj.measurements}
                            onChange={(e) =>
                              handleGlobalMeasurementChange(
                                index,
                                e.target.value
                              )
                            }
                            className="border p-2 rounded bg-white w-full"
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.globalMeasurements.availableSizes.map(
                    (size, index) => (
                      <div key={index} className="border p-3 rounded bg-white">
                        <div className="flex items-center mb-2">
                          <span className="font-bold text-lg">{size.size}</span>
                        </div>
                        <input
                          type="text"
                          value={size.measurements}
                          onChange={(e) =>
                            handleGlobalMeasurementChange(index, e.target.value)
                          }
                          className="border p-2 w-full rounded"
                          placeholder="Enter measurements"
                        />
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {formData.sizeType === "free" && (
            <div>
              <h3 className="font-semibold mb-2">Free Size Measurements</h3>
              <input
                type="text"
                value={formData.globalMeasurements.freeSize.measurements}
                onChange={(e) =>
                  handleGlobalFreeSizeMeasurementChange(e.target.value)
                }
                className="border p-2 w-full rounded bg-white"
                placeholder="Enter measurements for free size"
              />
            </div>
          )}
        </div>
      )}

      <div>
        <h2 className="font-bold mb-4">Product Variants</h2>
        {formData.variants?.map((variant, variantIndex) => (
          <div
            key={variantIndex}
            className="border p-4 rounded-lg mb-4 bg-gray-50"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Variant {variantIndex + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeVariant(variantIndex)}
                className="text-red-500 font-bold hover:underline"
              >
                Remove Variant
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block font-bold mb-1">Color Name</label>
                <input
                  type="text"
                  value={variant.name}
                  onChange={(e) =>
                    handleVariantChange(variantIndex, "name", e.target.value)
                  }
                  className="border p-2 w-full rounded bg-white"
                  placeholder="Enter color name"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Color Code</label>
                <input
                  type="text"
                  value={variant.colorCode}
                  onChange={(e) =>
                    handleVariantChange(
                      variantIndex,
                      "colorCode",
                      e.target.value
                    )
                  }
                  className="border p-2 w-full rounded bg-white"
                  placeholder="Enter color hex code"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold mb-1">Product ID</label>
                <input
                  type="text"
                  value={variant.productId || ""}
                  onChange={(e) =>
                    handleVariantChange(
                      variantIndex,
                      "productId",
                      e.target.value
                    )
                  }
                  className="border p-2 w-full rounded bg-white"
                  placeholder="Enter product ID for this variant"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-bold mb-2">Variant Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleVariantImageUpload(variantIndex, e)}
                className="border p-2 w-full rounded bg-white"
              />
              {imageError && <p className="text-red-500 mt-2">{imageError}</p>}
              {loading && <p className="mt-2">Uploading...</p>}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                {variant.images?.map((image, imageIndex) => (
                  <div key={imageIndex} className="relative">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Variant ${variantIndex + 1} Image ${
                        imageIndex + 1
                      }`}
                      width={150}
                      height={150}
                      className="border rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteVariantImage(variantIndex, imageIndex)
                      }
                      className="absolute top-0 right-0 bg-red-500 text-white p-1 text-xs rounded"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">
                Availability for this Variant
              </h4>

              {formData.sizeType === "individual" && (
                <div>
                  {formData.category === "shoes" ? (
                    <div className="space-y-2">
                      {variant.availableSizes?.map((sizeObj, sizeIndex) => (
                        <div
                          key={sizeIndex}
                          className="flex items-center space-x-4"
                        >
                          <div className="w-1/4">
                            <span className="font-medium">
                              {sizeObj.size || "Size"}
                            </span>
                          </div>
                          <div className="w-1/4">
                            <input
                              type="number"
                              min="0"
                              placeholder="Availability"
                              value={sizeObj.availability}
                              onChange={(e) =>
                                handleVariantSizeChange(
                                  variantIndex,
                                  sizeIndex,
                                  e.target.value
                                )
                              }
                              className="border p-2 rounded bg-white w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {variant.availableSizes?.map((size, sizeIndex) => (
                        <div
                          key={sizeIndex}
                          className="border p-3 rounded bg-white"
                        >
                          <div className="flex items-center mb-2">
                            <span className="font-bold">{size.size}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={size.availability}
                            onChange={(e) =>
                              handleVariantSizeChange(
                                variantIndex,
                                sizeIndex,
                                e.target.value
                              )
                            }
                            className="border p-2 w-full rounded"
                            placeholder="Quantity"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {formData.sizeType === "free" && (
                <div className="border p-3 rounded bg-white">
                  <label className="block font-medium mb-1">
                    Free Size Availability
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variant.freeSize?.availability || 0}
                    onChange={(e) =>
                      handleVariantFreeSizeChange(variantIndex, e.target.value)
                    }
                    className="border p-2 w-full rounded"
                    placeholder="Enter quantity"
                  />
                </div>
              )}

              {formData.sizeType === "none" && (
                <div className="border p-3 rounded bg-white">
                  <label className="block font-medium mb-1">
                    Product Availability
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variant.noSize?.availability || 0}
                    onChange={(e) =>
                      handleVariantNoSizeChange(variantIndex, e.target.value)
                    }
                    className="border p-2 w-full rounded"
                    placeholder="Enter quantity"
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addVariant}
          className="text-blue-500 hover:underline font-medium"
        >
          + Add Variant
        </button>
      </div>

      <button
        type="submit"
        className="p-5 btn-primary bg-[#242833] text-white border-transparent hover:bg-white hover:text-black hover:border-black border transition-all duration-300 rounded"
        disabled={uploading || loading}
      >
        {uploading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                fill="currentColor"
              />
              <path
                className="opacity-75"
                fill="none"
                d="M4 12a8 8 0 018-8v1a7 7 0 00-7 7H4z"
              />
            </svg>
            Updating...
          </span>
        ) : (
          "Update Product"
        )}
      </button>
    </form>
  );
};

export default EditForm;
