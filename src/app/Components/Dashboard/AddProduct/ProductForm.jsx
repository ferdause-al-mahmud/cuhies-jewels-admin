"use client";

import { useState, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { optimizeImage } from "@/app/utils/imageOptimization";

import dynamic from "next/dynamic";

const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false,
  loading: () => (
    <div className="border p-2 w-full rounded h-40">Loading editor...</div>
  ),
});

const initialProduct = {
  id: "",
  name: "",
  price: 0,
  offerPercentage: 0,
  offerPrice: 0,
  description: "",
  category: "",
  subcategory: "",
  type: [],
  sizeType: "individual",
  globalMeasurements: {
    availableSizes: [
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
};

// Example category data
const winterCategories = [{ title: "Long-Coat" }, { title: "Jacket" }];
const type = [
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

const ProductForm = () => {
  const [product, setProduct] = useState({
    id: "",
    name: "",
    price: 0,
    offerPercentage: 0,
    offerPrice: 0,
    description: "",
    category: "",
    subcategory: "",
    type: [], // ✅ always an array
    sizeType: "individual", // "individual", "free", "none"
    globalMeasurements: {
      availableSizes: [
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
  const editor = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  const createVariantImageUpload = useCallback(
    (variantIndex) => {
      return async (acceptedFiles) => {
        setLoading(true);
        setImageError("");

        try {
          const optimizedFiles = await Promise.all(
            acceptedFiles.map(async (file) => {
              try {
                return await optimizeImage(file);
              } catch (error) {
                console.error("Error optimizing image:", error);
                return file;
              }
            })
          );

          const uploadedImageDetails = await Promise.all(
            optimizedFiles.map(async (file) => {
              const formData = new FormData();
              formData.append("file", file);
              formData.append("upload_preset", "CuhiesJewels");
              formData.append("folder", "CuhiesJewels");

              const response = await axios.post(
                `https://api.cloudinary.com/v1_1/dvktrl9as/image/upload`,
                formData
              );
              return {
                url: response.data.secure_url,
                public_id: response.data.public_id,
                fileName: response.data.original_filename,
              };
            })
          );

          const urls = uploadedImageDetails.map((image) => image.url);

          const updatedVariants = [...product.variants];
          updatedVariants[variantIndex].images = [
            ...updatedVariants[variantIndex].images,
            ...urls,
          ];

          setProduct({ ...product, variants: updatedVariants });
        } catch (error) {
          setImageError("Image upload failed. Please try again.");
          console.error("Error uploading image:", error);
        } finally {
          setLoading(false);
        }
      };
    },
    [product]
  ); // Updated dependency to product

  const handleChange = (e) => {
    const { name, value } = e.target;

    let parsedValue = value;
    if (name === "price" || name === "offerPercentage") {
      parsedValue = value === "" ? "" : Number.parseFloat(value);
    }

    if (name === "offerPercentage" && product.price) {
      const calculatedOfferPrice =
        product.price - (product.price * value) / 100;
      setProduct({
        ...product,
        offerPercentage: parsedValue,
        offerPrice: isNaN(calculatedOfferPrice)
          ? 0
          : calculatedOfferPrice.toFixed(2),
      });
    } else {
      setProduct({
        ...product,
        [name]: parsedValue,
      });
    }
  };

  const handleSizeTypeChange = (e) => {
    const sizeType = e.target.value;
    let defaultSizes = [];
    let defaultGlobalMeasurements = {};

    if (sizeType === "individual") {
      if (product.category === "shoes") {
        defaultSizes = [
          { size: "38", availability: 0 },
          { size: "39", availability: 0 },
        ];
        defaultGlobalMeasurements = {
          availableSizes: [
            { size: "38", measurements: "" },
            { size: "39", measurements: "" },
          ],
          freeSize: { measurements: "" },
        };
      } else {
        defaultSizes = [
          { size: "S", availability: 0 },
          { size: "M", availability: 0 },
          { size: "L", availability: 0 },
          { size: "XL", availability: 0 },
          { size: "XXL", availability: 0 },
        ];
        defaultGlobalMeasurements = {
          availableSizes: [
            { size: "S", measurements: "" },
            { size: "M", measurements: "" },
            { size: "L", measurements: "" },
            { size: "XL", measurements: "" },
            { size: "XXL", measurements: "" },
          ],
          freeSize: { measurements: "" },
        };
      }
    } else {
      defaultGlobalMeasurements = {
        availableSizes: [],
        freeSize: { measurements: "" },
      };
    }

    const updatedVariants = product.variants.map((variant) => ({
      ...variant,
      availableSizes: sizeType === "individual" ? defaultSizes : [],
      freeSize: { availability: 0 },
      noSize: { availability: 0 },
    }));

    setProduct({
      ...product,
      sizeType,
      globalMeasurements: defaultGlobalMeasurements,
      variants: updatedVariants,
    });
  };

  const handleVariantChange = (variantIndex, field, value) => {
    const updatedVariants = [...product.variants];
    if (field === "colorCode" && !value.startsWith("#")) {
      value = "#" + value.replace(/#/g, "");
    }
    updatedVariants[variantIndex][field] = value;
    setProduct({ ...product, variants: updatedVariants });
  };

  const addVariant = () => {
    const newVariant = {
      name: "",
      productId: "",
      colorCode: "",
      images: [],
      availableSizes:
        product.sizeType === "individual"
          ? product.globalMeasurements.availableSizes.map((size) => ({
              size: size.size,
              availability: 0,
            }))
          : [],
      freeSize: { availability: 0 },
      noSize: { availability: 0 },
    };

    setProduct({
      ...product,
      variants: [...product.variants, newVariant],
    });
  };

  const removeVariant = (index) => {
    const updatedVariants = product.variants.filter((_, i) => i !== index);
    setProduct({ ...product, variants: updatedVariants });
  };

  const handleDeleteVariantImage = (variantIndex, imageIndex) => {
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex].images = updatedVariants[
      variantIndex
    ].images.filter((_, i) => i !== imageIndex);
    setProduct({ ...product, variants: updatedVariants });
  };

  const handleVariantSizeChange = (variantIndex, sizeIndex, field, value) => {
    const updatedVariants = [...product.variants];
    const numValue = value === "" ? 0 : Number(value);
    updatedVariants[variantIndex].availableSizes[sizeIndex][field] =
      numValue < 0 ? 0 : numValue;
    setProduct({ ...product, variants: updatedVariants });
  };

  const handleVariantFreeSizeChange = (variantIndex, value) => {
    const updatedVariants = [...product.variants];
    const numValue = value === "" ? 0 : Number(value);
    updatedVariants[variantIndex].freeSize.availability =
      numValue < 0 ? 0 : numValue;
    setProduct({ ...product, variants: updatedVariants });
  };

  const handleVariantNoSizeChange = (variantIndex, value) => {
    const updatedVariants = [...product.variants];
    const numValue = value === "" ? 0 : Number(value);
    updatedVariants[variantIndex].noSize.availability =
      numValue < 0 ? 0 : numValue;
    setProduct({ ...product, variants: updatedVariants });
  };

  const addVariantShoeSize = (variantIndex) => {
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex].availableSizes.push({
      size: "",
      availability: 0,
    });

    const updatedGlobalMeasurements = { ...product.globalMeasurements };
    updatedGlobalMeasurements.availableSizes.push({
      size: "",
      measurements: "",
    });

    setProduct({
      ...product,
      variants: updatedVariants,
      globalMeasurements: updatedGlobalMeasurements,
    });
  };

  const removeVariantShoeSize = (variantIndex, sizeIndex) => {
    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex].availableSizes = updatedVariants[
      variantIndex
    ].availableSizes.filter((_, i) => i !== sizeIndex);

    const updatedGlobalMeasurements = { ...product.globalMeasurements };
    updatedGlobalMeasurements.availableSizes =
      updatedGlobalMeasurements.availableSizes.filter(
        (_, i) => i !== sizeIndex
      );

    setProduct({
      ...product,
      variants: updatedVariants,
      globalMeasurements: updatedGlobalMeasurements,
    });
  };

  const handleCategoryChange = (e) => {
    const selectedCategory = e.target.value;

    let defaultSizes;
    let defaultGlobalMeasurements;
    if (selectedCategory === "Shoes") {
      defaultSizes = [
        { size: "38", availability: 0 },
        { size: "39", availability: 0 },
      ];
      defaultGlobalMeasurements = {
        availableSizes: [
          { size: "38", measurements: "" },
          { size: "39", measurements: "" },
        ],
        freeSize: { measurements: "" },
      };
    } else {
      defaultSizes = [
        { size: "S", availability: 0 },
        { size: "M", availability: 0 },
        { size: "L", availability: 0 },
        { size: "XL", availability: 0 },
        { size: "XXL", availability: 0 },
      ];
      defaultGlobalMeasurements = {
        availableSizes: [
          { size: "S", measurements: "" },
          { size: "M", measurements: "" },
          { size: "L", measurements: "" },
          { size: "XL", measurements: "" },
          { size: "XXL", measurements: "" },
        ],
        freeSize: { measurements: "" },
      };
    }

    const updatedVariants = product.variants.map((variant) => ({
      ...variant,
      availableSizes:
        product.sizeType === "individual"
          ? defaultSizes
          : variant.availableSizes,
    }));

    setProduct({
      ...product,
      category: selectedCategory,
      subcategory: "",
      variants: updatedVariants,
      globalMeasurements: defaultGlobalMeasurements,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const response = await axios.post("/api/add-product", product);
      toast.success("Product added successfully");
      setProduct(initialProduct);
    } catch (error) {
      console.error(
        "Error adding product:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message ||
          "Error adding product. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const allCategories = [
    ...winterCategories,
    ...clothingCategories,
    ...accessoriesCategories,
    { title: "Bags & Shoes", value: "bags-and-shoes" },
    { title: "Perfumes", value: "perfumes" },
  ];

  const handleGlobalMeasurementChange = (sizeIndex, value) => {
    const updatedGlobalMeasurements = { ...product.globalMeasurements };
    updatedGlobalMeasurements.availableSizes[sizeIndex].measurements = value;
    setProduct({ ...product, globalMeasurements: updatedGlobalMeasurements });
  };

  const handleGlobalFreeSizeMeasurementChange = (value) => {
    const updatedGlobalMeasurements = { ...product.globalMeasurements };
    updatedGlobalMeasurements.freeSize.measurements = value;
    setProduct({ ...product, globalMeasurements: updatedGlobalMeasurements });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-black">
      <div>
        <label className="block font-bold mb-2">Product ID</label>
        <input
          type="text"
          name="id"
          value={product.id}
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
          value={product.name}
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
          value={product.price}
          onChange={handleChange}
          className="border p-2 w-full rounded bg-gray-100"
          placeholder="Enter product price"
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
          value={product.offerPercentage}
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
          onChange={handleChange}
          value={product.offerPrice}
          className="border p-2 w-full rounded bg-gray-100"
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Description</label>
        <JoditEditor
          ref={editor}
          value={product.description}
          onChange={(newContent) => {
            setProduct({
              ...product,
              description: newContent,
            });
          }}
        />
      </div>

      <div>
        <label className="block font-bold mb-2">Category</label>
        <select
          name="category"
          value={product.category}
          onChange={handleCategoryChange}
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
          {/* Show selected types as pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {product.type?.map((selectedType, index) => (
              <span
                key={index}
                className="flex items-center gap-1 capitalize bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm"
              >
                {selectedType}
                <button
                  type="button"
                  onClick={() => {
                    setProduct({
                      ...product,
                      type: product.type.filter((t) => t !== selectedType),
                    });
                  }}
                  className="text-red-500 font-bold hover:text-red-700 "
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Buttons to toggle types */}
          <div className="grid grid-cols-3 gap-2">
            {type.map((item, index) => {
              const isSelected = product?.type?.includes(item.title);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setProduct({
                        ...product,
                        type: product.type.filter((t) => t !== item.title),
                      });
                    } else {
                      setProduct({
                        ...product,
                        type: [...product.type, item.title],
                      });
                    }
                  }}
                  className={`p-2 rounded border capitalize ${
                    isSelected
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item.title}
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
          value={product.sizeType}
          onChange={handleSizeTypeChange}
          className="border p-2 w-full rounded bg-gray-100"
          required
        >
          <option value="individual">Individual Size</option>
          <option value="free">Free Size</option>
          <option value="none">No Size</option>
        </select>
      </div>

      {(product.sizeType === "individual" || product.sizeType === "free") && (
        <div className="border p-4 rounded bg-blue-50">
          <h2 className="font-bold mb-4 text-lg">
            Global Size Measurements (Applied to All Variants)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            These measurements will apply to all variants. Only availability
            differs per variant.
          </p>

          {product.sizeType === "individual" && (
            <>
              {product.category === "shoes" ? (
                <>
                  {product.globalMeasurements.availableSizes.map(
                    (sizeObj, sizeIndex) => (
                      <div
                        key={sizeIndex}
                        className="flex space-x-4 mb-2 items-end"
                      >
                        <div className="w-1/3">
                          <label className="block font-bold mb-1">Size</label>
                          <input
                            type="text"
                            value={sizeObj.size}
                            onChange={(e) => {
                              const updatedGlobalMeasurements = {
                                ...product.globalMeasurements,
                              };
                              updatedGlobalMeasurements.availableSizes[
                                sizeIndex
                              ].size = e.target.value;
                              setProduct({
                                ...product,
                                globalMeasurements: updatedGlobalMeasurements,
                              });
                            }}
                            className="border p-2 w-full rounded bg-white"
                            placeholder="e.g., 38"
                          />
                        </div>
                        <div className="w-2/3">
                          <label className="block font-bold mb-1">
                            Measurements
                          </label>
                          <input
                            type="text"
                            value={sizeObj.measurements}
                            onChange={(e) =>
                              handleGlobalMeasurementChange(
                                sizeIndex,
                                e.target.value
                              )
                            }
                            className="border p-2 w-full rounded bg-white"
                            placeholder="Enter measurements for this size"
                          />
                        </div>
                      </div>
                    )
                  )}
                </>
              ) : (
                <>
                  {product.globalMeasurements.availableSizes.map(
                    (size, sizeIndex) => (
                      <div key={sizeIndex} className="mb-4">
                        <div className="flex space-x-4">
                          <div className="w-1/3">
                            <label className="block font-bold mb-2">
                              Size ({size.size})
                            </label>
                            <input
                              type="text"
                              value={size.size}
                              disabled
                              className="border p-2 w-full rounded bg-gray-100"
                            />
                          </div>
                          <div className="w-2/3">
                            <label className="block font-bold mb-2">
                              Measurements
                            </label>
                            <input
                              type="text"
                              value={size.measurements}
                              onChange={(e) =>
                                handleGlobalMeasurementChange(
                                  sizeIndex,
                                  e.target.value
                                )
                              }
                              className="border p-2 w-full rounded bg-white"
                              placeholder={`Enter measurements for ${size.size}`}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}

          {product.sizeType === "free" && (
            <div className="w-full">
              <label className="block font-bold mb-2">
                Free Size Measurements
              </label>
              <input
                type="text"
                value={product.globalMeasurements.freeSize.measurements}
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
        <h2 className="font-bold mb-4 text-lg">Product Variants</h2>
        {product.variants.map((variant, variantIndex) => {
          const VariantImageDropzone = ({ variantIndex }) => {
            const { getRootProps, getInputProps, isDragActive } = useDropzone({
              onDrop: createVariantImageUpload(variantIndex),
            });

            return (
              <div>
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer rounded bg-gray-100 mb-2"
                >
                  <input {...getInputProps()} />
                  {isDragActive ? (
                    <p>Drop the files here ...</p>
                  ) : (
                    <p>
                      Drag & drop images for this variant, or click to select
                    </p>
                  )}
                </div>
                {imageError && (
                  <p className="text-red-500 mt-2">{imageError}</p>
                )}
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {variant.images.map((url, imageIndex) => (
                    <div key={imageIndex} className="relative">
                      <Image
                        src={url || "/placeholder.svg"}
                        alt={`Variant ${variantIndex + 1} Image ${
                          imageIndex + 1
                        }`}
                        width={100}
                        height={100}
                        loading="lazy"
                        className="rounded"
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
            );
          };

          return (
            <div
              key={variantIndex}
              className="border p-4 rounded mb-4 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-md">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block font-bold mb-1">Color Name</label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) =>
                      handleVariantChange(variantIndex, "name", e.target.value)
                    }
                    className="border p-2 w-full rounded bg-white"
                    placeholder="e.g., Royal Blue"
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
                    placeholder="#FFFFFF"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    Product ID for Variant
                  </label>
                  <input
                    type="text"
                    value={variant.productId}
                    onChange={(e) =>
                      handleVariantChange(
                        variantIndex,
                        "productId",
                        e.target.value
                      )
                    }
                    className="border p-2 w-full rounded bg-white"
                    placeholder="Enter variant product ID"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block font-bold mb-2">Variant Images</label>
                <VariantImageDropzone variantIndex={variantIndex} />
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  Size Availability for this Variant
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Measurements are set globally above. Only set availability
                  here.
                </p>

                {product.sizeType === "individual" && (
                  <>
                    {product.category === "shoes" ? (
                      <>
                        {variant.availableSizes.map((sizeObj, sizeIndex) => (
                          <div
                            key={sizeIndex}
                            className="flex space-x-4 mb-2 items-end"
                          >
                            <div className="w-1/2">
                              <label className="block font-bold mb-1">
                                Size
                              </label>
                              <input
                                type="text"
                                value={sizeObj.size}
                                onChange={(e) =>
                                  handleVariantSizeChange(
                                    variantIndex,
                                    sizeIndex,
                                    "size",
                                    e.target.value
                                  )
                                }
                                className="border p-2 w-full rounded bg-white"
                                placeholder="e.g., 38"
                              />
                            </div>
                            <div className="w-1/2">
                              <label className="block font-bold mb-1">
                                Availability
                              </label>
                              <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                value={sizeObj.availability || ""}
                                onChange={(e) =>
                                  handleVariantSizeChange(
                                    variantIndex,
                                    sizeIndex,
                                    "availability",
                                    e.target.value
                                  )
                                }
                                className="border p-2 w-full rounded bg-white"
                                min={0}
                                placeholder="Qty"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                removeVariantShoeSize(variantIndex, sizeIndex)
                              }
                              className="text-red-500 font-bold hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addVariantShoeSize(variantIndex)}
                          className="text-blue-500 hover:underline"
                        >
                          + Add Size
                        </button>
                      </>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {variant.availableSizes.map((size, sizeIndex) => (
                          <div key={sizeIndex} className="mb-4">
                            <div className="flex space-x-4">
                              <div className="w-full">
                                <label className="block font-bold mb-2">
                                  Size ({size.size})
                                </label>
                                <input
                                  type="number"
                                  onWheel={(e) => e.target.blur()}
                                  value={size.availability || ""}
                                  onChange={(e) =>
                                    handleVariantSizeChange(
                                      variantIndex,
                                      sizeIndex,
                                      "availability",
                                      e.target.value
                                    )
                                  }
                                  className="border p-2 w-full rounded bg-white"
                                  placeholder={`Enter availability for ${size.size}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {product.sizeType === "free" && (
                  <div className="flex space-x-4 mb-4">
                    <div className="w-1/2">
                      <label className="block font-bold mb-2">
                        Availability
                      </label>
                      <input
                        type="number"
                        onWheel={(e) => e.target.blur()}
                        value={variant.freeSize.availability || ""}
                        onChange={(e) =>
                          handleVariantFreeSizeChange(
                            variantIndex,
                            e.target.value
                          )
                        }
                        className="border p-2 w-full rounded bg-white"
                        placeholder="Enter availability"
                        min={0}
                      />
                    </div>
                    {/* <div className="w-1/2">
                      <label className="block font-bold mb-2">
                        Measurements (Global)
                      </label>
                      <input
                        type="text"
                        value={product.globalMeasurements.freeSize.measurements}
                        disabled
                        className="border p-2 w-full rounded bg-gray-100"
                        placeholder="Set in global measurements above"
                      />
                    </div> */}
                  </div>
                )}

                {product.sizeType === "none" && (
                  <div className="w-1/2">
                    <label className="block font-bold mb-2">Availability</label>
                    <input
                      type="number"
                      onWheel={(e) => e.target.blur()}
                      value={variant.noSize.availability || ""}
                      onChange={(e) =>
                        handleVariantNoSizeChange(variantIndex, e.target.value)
                      }
                      className="border p-2 w-full rounded bg-white"
                      placeholder="Enter availability"
                      min={0}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={addVariant}
          className="text-blue-500 hover:underline font-semibold"
        >
          + Add New Variant
        </button>
      </div>
      <button
        type="submit"
        className="p-5 btn-primary bg-[#242833] text-white border-transparent hover:bg-gray-100 hover:text-black hover:border-black border transition-all duration-300 rounded"
        disabled={loading || uploading}
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
            Loading...
          </span>
        ) : (
          "Add Product"
        )}
      </button>
    </form>
  );
};

export default ProductForm;
