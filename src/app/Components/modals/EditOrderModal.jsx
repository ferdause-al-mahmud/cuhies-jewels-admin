"use client";
import {
  Box,
  Typography,
  Paper,
  Button,
  Select,
  MenuItem,
  TextField,
  ButtonGroup,
  Modal,
  Grid,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
} from "@mui/material";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { MdClose } from "react-icons/md";

const EditOrderModal = ({
  editModalOpen,
  closeEditModal,
  modalStyle,
  editingOrder,
  handleEditSubmit,
  editFormData,
  handlePhoneChange,
  handleNotesChange,
  handleAddressFieldChange,
  handleOrderFromChange,
  handleLastDigitsChange,
  productSearchQuery,
  setProductSearchQuery,
  isTyping,
  setIsTyping,
  products,
  addProductToOrder,
  handleItemSizeChange,
  handleItemQuantityChange,
  handleItemPriceChange,
  handleItemVariantChange,
  removeProductFromOrder,
  handleShippingCostChange,
  handleAdvancePaymentChange,
  handleDiscountChange,
}) => {
  const [cartProducts, setCartProducts] = useState([]);

  const fetchProduct = async (id) => {
    try {
      const response = await fetch(`/api/product/${id}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error("Product not found");
      }
    } catch (error) {
      throw new Error("Failed to load product");
    }
  };

  useEffect(() => {
    if (editModalOpen && editFormData?.cart?.length > 0) {
      const fetchProducts = async () => {
        try {
          const productDetails = await Promise.all(
            editFormData.cart.map((item) => fetchProduct(item?.id))
          );
          setCartProducts(productDetails);
        } catch (err) {
          console.error("Error fetching cart products:", err);
        }
      };

      fetchProducts();
    }
  }, [editModalOpen, editFormData]);

  // Find variant by variant ID
  const findVariantByVariantId = (product, variantId) => {
    if (!product?.variants) return null;
    return (
      product.variants.find((variant) => variant.productId === variantId) ||
      product.variants[0]
    );
  };

  // Get available sizes for a variant
  const getAvailableSizes = (product, variant) => {
    if (!product || !variant) return [];
    if (product.sizeType === "free") return ["Free"];
    if (product.sizeType === "noSize") return [];
    if (product.sizeType === "individual") {
      return (
        variant.availableSizes?.map((size) => size.size) || [
          "S",
          "M",
          "L",
          "XL",
          "XXL",
        ]
      );
    }
    return [];
  };

  return (
    <div>
      <Modal
        open={editModalOpen}
        onClose={closeEditModal}
        aria-labelledby="edit-order-modal"
        aria-describedby="modal-to-edit-order-details"
      >
        <Box sx={modalStyle}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5" component="h2">
              Edit Order #{editingOrder?.orderID}
            </Typography>
            <IconButton onClick={closeEditModal} size="large">
              <MdClose />
            </IconButton>
          </Box>

          <form onSubmit={handleEditSubmit}>
            <Grid container spacing={3}>
              {/* Customer Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Customer Phone"
                  value={editFormData.phone}
                  onChange={handlePhoneChange}
                  variant="outlined"
                  margin="normal"
                  inputProps={{
                    maxLength: 11,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={editFormData.notes}
                  onChange={handleNotesChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>

              {/* Address Fields */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Street"
                  value={editFormData.street}
                  onChange={(e) =>
                    handleAddressFieldChange("street", e.target.value)
                  }
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Thana"
                  value={editFormData.thana}
                  onChange={(e) =>
                    handleAddressFieldChange("thana", e.target.value)
                  }
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Upazilla"
                  value={editFormData.upazilla}
                  onChange={(e) =>
                    handleAddressFieldChange("upazilla", e.target.value)
                  }
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Zilla"
                  value={editFormData.zilla}
                  onChange={(e) =>
                    handleAddressFieldChange("zilla", e.target.value)
                  }
                  variant="outlined"
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Shipping Cost"
                  value={editFormData.shippingCost}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">৳</InputAdornment>
                    ),
                  }}
                  onChange={(e) => handleShippingCostChange(e.target.value)}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Advance"
                  value={editFormData.advancePayment}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">৳</InputAdornment>
                    ),
                  }}
                  onChange={(e) => handleAdvancePaymentChange(e.target.value)}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Discount"
                  value={editFormData.discount}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">৳</InputAdornment>
                    ),
                  }}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Order Total (with shipping)"
                  value={editFormData.total}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">৳</InputAdornment>
                    ),
                    readOnly: true,
                  }}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Order From"
                  fullWidth
                  value={editFormData.orderFrom}
                  onChange={handleOrderFromChange}
                  margin="normal"
                >
                  <MenuItem value="">Website</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="wp">WhatsApp</MenuItem>
                  <MenuItem value="insta">Instagram</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Last digits"
                  value={editFormData.lastDigits}
                  onChange={handleLastDigitsChange}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>

              {/* Product Search */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Add Products
                </Typography>
                <TextField
                  fullWidth
                  label="Search Products"
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setIsTyping(true);
                  }}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CiSearch />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Search Results */}
                {products.length > 0 && (
                  <div className="mt-2 p-4 max-h-72 overflow-auto bg-white rounded shadow">
                    <h2 className="text-sm font-semibold mb-2">
                      Search Results
                    </h2>
                    {products.map((product) => (
                      <div
                        key={product._id}
                        className="flex items-center justify-between p-2 mb-2 border border-gray-300 rounded hover:bg-gray-100 cursor-pointer transition"
                        onClick={() => addProductToOrder(product)}
                      >
                        <div className="flex items-center">
                          {(product?.imageUrl ||
                            product?.variants[0]?.images) &&
                          (product?.imageUrl?.length > 0 ||
                            product?.variants[0]?.images?.length > 0) ? (
                            <div className="relative w-10 h-10 mr-2">
                              <Image
                                src={
                                  product?.imageUrl
                                    ? product?.imageUrl[0]
                                    : product?.variants[0]?.images[0] ||
                                      "/placeholder.svg"
                                }
                                alt={product?.name}
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 mr-2 rounded" />
                          )}
                          <div>
                            <p className="text-base">
                              {product.name} - {product?.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              {product.offerPrice ? (
                                <>
                                  <span className="line-through mr-2">
                                    ৳{product.price.toFixed(2)}
                                  </span>
                                  <span className="text-green-600">
                                    ৳{product.offerPrice}
                                  </span>
                                </>
                              ) : (
                                <>৳{product.price.toFixed(2)}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          className="border border-gray-400 text-sm px-2 py-1 rounded hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            addProductToOrder(product);
                          }}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {isTyping && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Searching...
                  </Typography>
                )}
              </Grid>

              {/* Cart Items */}
              <Grid item xs={12} className="">
                <Typography variant="h6" gutterBottom>
                  Order Items
                </Typography>

                {editFormData.cart?.map((item, index) => {
                  const product = cartProducts[index];
                  const currentVariant = findVariantByVariantId(
                    product,
                    item.variantId
                  );
                  const availableSizes = getAvailableSizes(
                    product,
                    currentVariant
                  );

                  return (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={2}>
                          <Box
                            className="flex flex-col gap-2"
                            alignItems="center"
                          >
                            {item?.imageUrl && item?.imageUrl?.length > 0 ? (
                              <Image
                                src={item?.imageUrl[0] || "/placeholder.svg"}
                                alt={item?.name || "Image"}
                                width={50}
                                height={50}
                                style={{ objectFit: "cover" }}
                              />
                            ) : (
                              <Box
                                width={50}
                                height={50}
                                sx={{
                                  backgroundColor: "#f0f0f0",
                                }}
                              />
                            )}
                            <Typography variant="body1" align="center">
                              {item.name} - {item.id}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <FormControl fullWidth variant="outlined">
                            <InputLabel id={`variant-label-${index}`}>
                              Variant
                            </InputLabel>
                            <Select
                              value={item.variantId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                const selectedVariant = product?.variants?.find(
                                  (v) => v.productId === selectedId
                                );
                                handleItemVariantChange(index, selectedVariant);
                              }}
                              label="Variant"
                            >
                              {product?.variants?.map((variant) => (
                                <MenuItem
                                  key={variant.productId}
                                  value={variant.productId}
                                >
                                  {variant.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          {product?.sizeType === "individual" ? (
                            <FormControl fullWidth variant="outlined">
                              <InputLabel id={`size-label-${index}`}>
                                Size
                              </InputLabel>
                              <Select
                                labelId={`size-label-${index}`}
                                value={item.selectedSize || ""}
                                onChange={(e) =>
                                  handleItemSizeChange(index, e.target.value)
                                }
                                label="Size"
                              >
                                {availableSizes.map((size) => (
                                  <MenuItem key={size} value={size}>
                                    {size}
                                  </MenuItem>
                                ))}
                                <MenuItem value="S">S</MenuItem>
                                <MenuItem value="M">M</MenuItem>
                                <MenuItem value="L">L</MenuItem>
                                <MenuItem value="XL">XL</MenuItem>
                                <MenuItem value="XXL">XXL</MenuItem>
                                <MenuItem value="(35-36)">(35-36)</MenuItem>
                                <MenuItem value="(37-38)">(37-38)</MenuItem>
                                <MenuItem value="(39-40)">(39-40)</MenuItem>
                                <MenuItem value="(40-41)">(40-41)</MenuItem>
                                <MenuItem value="(42-43)">(42-43)</MenuItem>
                                <MenuItem value="(44-45)">(44-45)</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <Typography variant="body2" sx={{ p: 2 }}>
                              {product?.sizeType === "free"
                                ? "Free Size"
                                : product?.sizeType === "noSize"
                                ? "No Size"
                                : "N/A"}
                            </Typography>
                          )}
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }}
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemQuantityChange(index, e.target.value)
                            }
                          />
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <TextField
                            fullWidth
                            label="Price"
                            type="number"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  ৳
                                </InputAdornment>
                              ),
                              inputProps: { min: 0, step: "0.01" },
                            }}
                            value={item.price}
                            onChange={(e) =>
                              handleItemPriceChange(index, e.target.value)
                            }
                          />
                        </Grid>

                        <Grid item xs={6} sm={3} md={2}>
                          <TextField
                            fullWidth
                            label="Item Total"
                            value={(item.price * item.quantity).toFixed(2)}
                            InputProps={{
                              readOnly: true,
                              startAdornment: (
                                <InputAdornment position="start">
                                  ৳
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>

                        <Grid
                          item
                          xs={12}
                          sm={3}
                          md={2}
                          display="flex"
                          justifyContent="flex-end"
                        >
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => removeProductFromOrder(index)}
                            startIcon={<MdClose />}
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Grid>

              <Grid
                item
                xs={12}
                display="flex"
                justifyContent="flex-end"
                mt={2}
              >
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={closeEditModal}
                  sx={{ mr: 2 }}
                >
                  Cancel
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default EditOrderModal;
