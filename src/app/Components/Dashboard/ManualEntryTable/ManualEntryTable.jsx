"use client";
import {
  Box,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Button,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
} from "@mui/material";
import { Pagination } from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { FiEdit } from "react-icons/fi";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";

import axios from "axios";
import EditOrderModal from "../../modals/EditOrderModal";
import SearchField from "../../ManualOrderComponents/SearchField";
import { modalStyle } from "@/app/const/modalStyle";
import { auth } from "@/app/firebase/firebase.config";
import { FaFacebook, FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";
const zillas = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barisal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapai Nawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
];

const ManualEntryTable = ({
  orders,
  totalPages,
  currentPage,
  refetchOrders,
}) => {
  const [page, setPage] = useState(currentPage || 1);
  const [updatedOrder, setUpdatedOrder] = useState({});
  const [disabledSave, setDisabledSave] = useState({});
  const [initialStatus, setInitialStatus] = useState({});
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState(orders);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, loading, error] = useAuthState(auth);
  const [newOrderData, setNewOrderData] = useState({
    formData: {
      name: "",
      email: "",
      address: "",
      street: "",
      thana: "",
      upazilla: "",
      zilla: "",
      phone: "",
      notes: "",
    },
    cart: [],
    paymentOption: "bkash",
    shippingOption: "insideDhaka",

    advancePayment: 0,
    total: 0,
    shippingCost: 80,
    discount: 0,
    status: "pending",
    orderFrom: "facebook",
    lastDigits: "",
    moderatorEmail: user?.email || "",
    moderatorName: user?.displayName || "",
  });

  // Edit order modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    phone: "",
    notes: "",
    address: "",
    street: "",
    thana: "",
    upazilla: "",
    zilla: "",
    cart: [],
    total: 0,
    shippingCost: 0,
    advancePayment: 0,
    discount: 0,
    orderFrom: "",
    lastDigits: "",
  });

  useEffect(() => {
    const statusMap = {};
    const disabledMap = {};
    orders?.forEach((order) => {
      statusMap[order.orderID] = order.status;
      disabledMap[order.orderID] = true;
    });
    setInitialStatus(statusMap);
    setDisabledSave(disabledMap);
  }, [orders]);

  useEffect(() => {
    if (orderSearchQuery) {
      setFilteredOrders(
        orders.filter((order) =>
          order?.formData?.phone
            ?.toLowerCase()
            .includes(orderSearchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredOrders(orders);
    }
  }, [orderSearchQuery, orders]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    router.push(`/dashboard/moderator-entry?page=${newPage}`);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setUpdatedOrder((prev) => ({ ...prev, [orderId]: newStatus }));
    setDisabledSave((prev) => ({
      ...prev,
      [orderId]: initialStatus[orderId] === newStatus,
    }));
  };

  const checkSoldOut = (product) => {
    if (!product || !product.variants?.length) return false;

    const parseAvail = (val) => parseInt(val, 10) || 0;

    // Loop through each variant to check if ANY availability > 0
    const hasStock = product.variants.some((variant) => {
      switch (product.sizeType) {
        case "individual":
          return variant.availableSizes?.some(
            (s) => parseAvail(s.availability) > 0
          );

        case "free":
          return parseAvail(variant.freeSize?.availability) > 0;

        case "none":
          return parseAvail(variant.noSize?.availability) > 0;

        default:
          // fallback if unexpected type
          return (
            variant.availableSizes?.some(
              (s) => parseAvail(s.availability) > 0
            ) ||
            parseAvail(variant.freeSize?.availability) > 0 ||
            parseAvail(variant.noSize?.availability) > 0
          );
      }
    });

    return !hasStock; // sold out if NO variant has stock
  };

  const handleSave = async (orderId) => {
    try {
      const updatedStatus = updatedOrder[orderId];
      const originalStatus = initialStatus[orderId];

      if (updatedStatus && updatedStatus !== originalStatus) {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: updatedStatus }),
        });

        if (response.ok) {
          toast.success("Order status updated successfully!");

          const orderDetails = orders.find(
            (order) => order.orderID === orderId
          );

          if (updatedStatus === "returned" && originalStatus !== "returned") {
            const quantityUpdates = orderDetails.cart?.map((item) => ({
              productId: item.id,
              variantId: item.variantId,
              size: item.selectedSize,
              quantity: Number.parseInt(item.quantity, 10),
            }));

            await fetch("/api/orders/update-quantity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ updates: quantityUpdates }),
            });
          }

          setInitialStatus((prev) => ({ ...prev, [orderId]: updatedStatus }));
          setDisabledSave((prev) => ({ ...prev, [orderId]: true }));
        } else {
          toast.error("Failed to update order status");
        }
      }
    } catch (error) {
      toast.error("Error updating order status");
      console.error("Error:", error);
    }
  };

  // Parse address into components
  const parseAddress = (address) => {
    if (!address) return { street: "", thana: "", upazilla: "", zilla: "" };

    const parts = address.split(",").map((part) => part.trim());
    return {
      street: parts[0] || "",
      thana: parts[1] || "",
      upazilla: parts[2] || "",
      zilla: parts[3] || "",
    };
  };

  // Combine address components
  const combineAddress = (street, thana, upazilla, zilla) => {
    const parts = [street, thana, upazilla, zilla].filter((part) =>
      part.trim()
    );
    return parts.join(", ");
  };

  // Edit order functions
  const openEditModal = (order) => {
    setEditingOrder(order);
    const addressParts = parseAddress(order.formData?.address);

    setEditFormData({
      phone: order.formData?.phone || "",
      notes: order.formData?.notes || "",
      address: order.formData?.address || "",
      street: addressParts.street,
      thana: addressParts.thana,
      upazilla: addressParts.upazilla,
      zilla: addressParts.zilla,
      cart: [
        ...order.cart?.map((item) => ({
          ...item,
          quantity: Number.parseInt(item.quantity, 10),
          originalPrice: item.price,
        })),
      ],
      total: order.total,
      shippingCost: order.shippingCost || 0,
      advancePayment: order.advancePayment || 0,
      discount: order.discount || 0,
      orderFrom: order.orderFrom || "",
      lastDigits: order.lastDigits || "",
    });
    setEditModalOpen(true);
    setProductSearchQuery("");
    setProducts([]);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingOrder(null);
  };

  const handlePhoneChange = (e) => {
    setEditFormData({
      ...editFormData,
      phone: e.target.value,
    });
  };

  const handleLastDigitsChange = (e) => {
    setEditFormData({
      ...editFormData,
      lastDigits: e.target.value,
    });
  };

  const handleShippingCostChange = (value) => {
    const shippingCost = Number.parseInt(value, 10) || 0;

    // Recalculate total with new shipping cost
    const cartTotal = calculateTotal(editFormData.cart);
    const newTotal =
      cartTotal +
      shippingCost -
      parseInt(editFormData.advancePayment) -
      parseInt(editFormData.discount);

    setEditFormData({
      ...editFormData,
      shippingCost: shippingCost,
      total: newTotal,
    });
  };

  const handleAdvancePaymentChange = (value) => {
    const advancePayment = Number.parseInt(value, 10) || 0;

    // Recalculate total with new advance payment
    const cartTotal = calculateTotal(editFormData.cart);
    const newTotal =
      cartTotal +
      editFormData.shippingCost -
      advancePayment -
      parseInt(editFormData.discount);

    setEditFormData({
      ...editFormData,
      advancePayment: advancePayment,
      total: newTotal,
    });
  };

  const handleDiscountChange = (value) => {
    const discount = Number.parseInt(value, 10) || 0;

    // Recalculate total with new discount
    const cartTotal = calculateTotal(editFormData.cart);
    const newTotal =
      cartTotal +
      editFormData.shippingCost -
      parseInt(editFormData.advancePayment) -
      discount;

    setEditFormData({
      ...editFormData,
      discount: discount,
      total: newTotal,
    });
  };

  const handleNotesChange = (e) => {
    setEditFormData({
      ...editFormData,
      notes: e.target.value,
    });
  };

  const handleShippingOptionChange = (value) => {
    let cost = 0;
    switch (value) {
      case "insideDhaka":
        cost = 80;
        break;
      case "dhakaSubCity":
        cost = 120;
        break;
      case "outsideDhaka":
        cost = 140;
        break;
      default:
        cost = 0;
    }

    const cartTotal = newOrderData.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotal =
      cartTotal + cost - newOrderData.discount - newOrderData.advancePayment;

    handleNewOrderFieldChange("shippingOption", value);
    handleNewOrderFieldChange("shippingCost", cost);
    handleNewOrderFieldChange("total", newTotal);
  };

  const handleAddressFieldChange = (field, value) => {
    const updatedData = {
      ...editFormData,
      [field]: value,
    };

    // Update combined address
    updatedData.address = combineAddress(
      updatedData.street,
      updatedData.thana,
      updatedData.upazilla,
      updatedData.zilla
    );

    setEditFormData(updatedData);
  };

  const handleOrderFromChange = (e) => {
    setEditFormData({
      ...editFormData,
      orderFrom: e.target.value,
    });
  };

  const handleItemQuantityChange = (index, value) => {
    const newCart = [...editFormData.cart];
    const newQuantity = Number.parseInt(value, 10) || 0;
    newCart[index].quantity = newQuantity;

    const cartTotal = calculateTotal(newCart);
    const newTotal =
      cartTotal +
      editFormData.shippingCost -
      parseInt(editFormData.advancePayment) -
      parseInt(editFormData.discount);

    setEditFormData({
      ...editFormData,
      cart: newCart,
      total: newTotal,
    });
  };

  const handleItemSizeChange = (index, value) => {
    const newCart = [...editFormData.cart];
    newCart[index].selectedSize = value;

    setEditFormData({
      ...editFormData,
      cart: newCart,
    });
  };

  const handleItemVariantChange = (index, value) => {
    const newCart = [...editFormData.cart];
    newCart[index].variantId = value.productId;
    newCart[index].variant = value;
    newCart[index].imageUrl = value.images || [];

    setEditFormData({
      ...editFormData,
      cart: newCart,
    });
  };

  const handleItemPriceChange = (index, value) => {
    const newCart = [...editFormData.cart];
    const newPrice = Number.parseFloat(value) || 0;
    newCart[index].price = newPrice;

    const cartTotal = calculateTotal(newCart);
    const newTotal =
      cartTotal +
      editFormData.shippingCost -
      parseInt(editFormData.advancePayment) -
      parseInt(editFormData.discount);

    setEditFormData({
      ...editFormData,
      cart: newCart,
      total: newTotal,
    });
  };

  const calculateTotal = (cart) => {
    return cart.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  };

  const handleProductSearch = useCallback(async () => {
    if (!productSearchQuery.trim()) return;

    try {
      const response = await axios.get(`/api/products`, {
        params: { name: productSearchQuery },
      });

      setProducts(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  }, [productSearchQuery]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (productSearchQuery.trim()) {
        handleProductSearch();
      } else {
        setProducts([]);
      }
      setIsTyping(false);
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [handleProductSearch, productSearchQuery]);

  const addProductToOrder = (product) => {
    const productPrice = product.offerPrice || product.price;
    const defaultVariant = product.variants[0];

    const existingItemIndex = editFormData.cart.findIndex(
      (item) =>
        item.id === product.id && item.variantId === defaultVariant.productId
    );

    if (existingItemIndex >= 0) {
      const newCart = [...editFormData.cart];
      newCart[existingItemIndex].quantity += 1;

      const cartTotal = calculateTotal(newCart);
      const newTotal =
        cartTotal +
        editFormData.shippingCost -
        parseInt(editFormData.advancePayment) -
        parseInt(editFormData.discount);

      setEditFormData({
        ...editFormData,
        cart: newCart,
        total: newTotal,
      });
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        variantId: defaultVariant.productId,
        price: productPrice,
        imageUrl: defaultVariant.images || [],
        selectedSize: product.sizeType === "individual" ? "M" : null,
        quantity: 1,
        originalPrice: product.price,
      };

      const newCart = [...editFormData.cart, newItem];
      const cartTotal = calculateTotal(newCart);
      const newTotal =
        cartTotal +
        editFormData.shippingCost -
        parseInt(editFormData.advancePayment) -
        parseInt(editFormData.discount);

      setEditFormData({
        ...editFormData,
        cart: newCart,
        total: newTotal,
      });
    }

    setProductSearchQuery("");
    setProducts([]);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editingOrder) return;

    try {
      const inventoryUpdates = [];
      const originalItems = editingOrder.cart || [];

      originalItems.forEach((originalItem) => {
        const originalQuantity = Number.parseInt(originalItem.quantity, 10);
        const originalSize = originalItem.selectedSize;
        const originalVariantId = originalItem.variantId;
        const productId = originalItem.id;

        const editedItem = editFormData.cart.find(
          (item) =>
            item.id === productId && item.variantId === originalVariantId
        );

        if (editedItem) {
          const newQuantity = editedItem.quantity;
          const newSize = editedItem.selectedSize;

          if (originalSize === newSize) {
            const quantityDiff = originalQuantity - newQuantity;
            if (quantityDiff !== 0) {
              inventoryUpdates.push({
                productId,
                variantId: originalVariantId,
                size: originalSize,
                quantity: quantityDiff,
              });
            }
          } else {
            inventoryUpdates.push({
              productId,
              variantId: originalVariantId,
              size: originalSize,
              quantity: originalQuantity,
            });

            inventoryUpdates.push({
              productId,
              variantId: originalVariantId,
              size: newSize,
              quantity: -newQuantity,
            });
          }
        } else {
          inventoryUpdates.push({
            productId,
            variantId: originalVariantId,
            size: originalSize,
            quantity: originalQuantity,
          });
        }
      });

      editFormData.cart.forEach((editedItem) => {
        const productId = editedItem.id;
        const variantId = editedItem.variantId;
        const newQuantity = editedItem.quantity;
        const newSize = editedItem.selectedSize;

        const originalItem = originalItems.find(
          (item) => item.id === productId && item.variantId === variantId
        );
        if (!originalItem) {
          inventoryUpdates.push({
            productId,
            variantId,
            size: newSize,
            quantity: -newQuantity,
          });
        }
      });

      const response = await fetch(`/api/edit-order/${editingOrder?.orderID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: editFormData.phone,
          notes: editFormData.notes,
          address: editFormData.address,
          street: editFormData.street,
          thana: editFormData.thana,
          upazilla: editFormData.upazilla,
          zilla: editFormData.zilla,
          cart: editFormData.cart?.map((item) => ({
            id: item.id,
            name: item.name,
            variantId: item.variantId,
            variant: item.variant,
            price: item.price,
            imageUrl: item.imageUrl,
            selectedSize: item.selectedSize,
            quantity: item.quantity.toString(),
          })),
          total: editFormData.total,
          shippingCost: editFormData.shippingCost,
          advancePayment: editFormData.advancePayment,
          discount: editFormData.discount,
          orderFrom: editFormData.orderFrom,
          lastDigits: editFormData.lastDigits,
        }),
      });

      if (response.ok) {
        if (inventoryUpdates.length > 0) {
          try {
            await fetch("/api/orders/update-quantity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ updates: inventoryUpdates }),
            });
          } catch (error) {
            console.error("Error updating inventory after order edit:", error);
          }
        }

        toast.success("Order updated successfully!");
        closeEditModal();
        router.refresh();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update order");
      }
    } catch (error) {
      toast.error("Error updating order");
      console.error("Error:", error);
    }
  };

  const removeProductFromOrder = (index) => {
    const newCart = editFormData.cart.filter((_, i) => i !== index);
    const cartTotal = calculateTotal(newCart);
    const newTotal =
      cartTotal +
      editFormData.shippingCost -
      parseInt(editFormData.advancePayment) -
      parseInt(editFormData.discount);

    setEditFormData({
      ...editFormData,
      cart: newCart,
      total: newTotal,
    });
  };

  const openAddModal = () => {
    setAddModalOpen(true);
    setProductSearchQuery("");
    setProducts([]);
    setNewOrderData({
      formData: {
        name: "",
        email: "",
        address: "",
        street: "",
        thana: "",
        upazilla: "",
        zilla: "",
        phone: "",
        notes: "",
      },
      cart: [],
      paymentOption: "bkash",
      shippingOption: "insideDhaka",

      advancePayment: 0,
      total: 0,
      shippingCost: 80,
      discount: 0,
      status: "pending",
      moderatorEmail: user?.email || "",
      moderatorName: user?.displayName || "",
      lastDigits: "",
      orderFrom: "facebook",
    });
  };

  const handleNumberSearch = (phone) => {
    const query = new URLSearchParams();
    query.set("page", "1");

    if (phone) {
      query.set("phone", phone);
    }

    router.push(`/dashboard/moderator-entry?${query.toString()}`);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddedProducts([]);
  };

  const handleNewOrderFormChange = (field, value) => {
    setNewOrderData((prev) => {
      let updatedFormData = { ...prev.formData };

      if (field === "address") {
        // If updating "address" directly (street, thana, etc.)
        updatedFormData = {
          ...updatedFormData,
          ...value, // value should be an object like { street: "abc" }
        };

        // Build combined address string
        const { street, thana, upazilla, zilla } = updatedFormData;
        updatedFormData.address = [street, thana, upazilla, zilla]
          .filter(Boolean)
          .join(", ");
      } else {
        // Normal single field update
        updatedFormData[field] = value;
      }

      return {
        ...prev,
        formData: updatedFormData,
      };
    });
  };

  const handleNewOrderFieldChange = (field, value) => {
    setNewOrderData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const addProductByOne = (index) => {
    const product = addedProducts[index];
    const productPrice = product?.offerPrice || product?.price;
    const defaultVariant = product?.variants[0];
    const newItem = {
      id: product?.id,
      name: product?.name,
      variants: product?.variants,
      variant: defaultVariant,
      variantId: defaultVariant.productId,
      sizeType: product?.sizeType,
      price: productPrice,
      imageUrl: defaultVariant.images || [],
      selectedSize: product?.sizeType === "individual" ? "M" : null,
      quantity: 1,
    };
    const newCart = [...newOrderData.cart, newItem];
    const cartTotal = newCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotal =
      cartTotal +
      newOrderData.shippingCost -
      newOrderData.discount -
      newOrderData.advancePayment;

    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
      total: newTotal,
    }));
  };
  const addProductToNewOrder = (product) => {
    const productPrice = product.offerPrice || product.price;
    const defaultVariant = product.variants[0];
    setAddedProducts((prev) => [...prev, product]);
    const newItem = {
      id: product.id,
      name: product.name,
      variants: product.variants,
      variant: defaultVariant,
      variantId: defaultVariant.productId,
      sizeType: product.sizeType,
      price: productPrice,
      imageUrl: defaultVariant.images || [],
      selectedSize: product.sizeType === "individual" ? "M" : null,
      quantity: 1,
    };
    const newCart = [...newOrderData.cart, newItem];
    const cartTotal = newCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotal =
      cartTotal +
      newOrderData.shippingCost -
      newOrderData.discount -
      newOrderData.advancePayment;

    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
      total: newTotal,
    }));

    setProductSearchQuery("");
    setProducts([]);
  };

  const removeProductFromNewOrder = (index) => {
    const newCart = newOrderData.cart.filter((_, i) => i !== index);
    const cartTotal = newCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotal =
      cartTotal +
      newOrderData.shippingCost -
      newOrderData.discount -
      newOrderData.advancePayment;
    if (newCart.length === 0) {
      setAddedProducts([]);
    }
    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
      total: newTotal,
    }));
  };

  const handleNewItemQuantityChange = (index, value) => {
    const newCart = [...newOrderData.cart];
    const newQuantity = Number.parseInt(value, 10) || 0;
    newCart[index].quantity = newQuantity;

    const cartTotal = newCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotal =
      cartTotal +
      newOrderData.shippingCost -
      newOrderData.discount -
      newOrderData.advancePayment;

    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
      total: newTotal,
    }));
  };

  const handleNewItemSizeChange = (index, value) => {
    const newCart = [...newOrderData.cart];
    newCart[index].selectedSize = value;

    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
    }));
  };

  const handleNewItemVariantChange = (index, value) => {
    const newCart = [...newOrderData.cart];
    newCart[index].variantId = value.productId;
    newCart[index].variant = value;
    newCart[index].imageUrl = value.images || [];

    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
    }));
  };

  const handleNewItemPriceChange = (index, value) => {
    const newCart = [...newOrderData.cart];
    const newPrice = Number.parseFloat(value) || 0;
    newCart[index].price = newPrice;

    const cartTotal = newCart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotal =
      cartTotal +
      newOrderData.shippingCost -
      newOrderData.discount -
      newOrderData.advancePayment;

    setNewOrderData((prev) => ({
      ...prev,
      cart: newCart,
      total: newTotal,
    }));
  };

  const handleAddOrderSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (newOrderData.cart.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    if (!newOrderData.formData.phone) {
      toast.error("Phone number is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedCart = newOrderData.cart.map((item) => ({
        id: item.id,
        name: item.name,
        variantId: item.variantId,
        variant: item.variant,
        price: item.price.toString(),
        imageUrl: item.imageUrl,
        selectedSize: item?.selectedSize || null,
        quantity: item.quantity.toString(),
      }));

      const orderData = {
        ...newOrderData,
        cart: formattedCart,
        type: "manual",
        moderatorEmail: user?.email || "",
        moderatorName: user?.displayName || "",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const result = await response.json();

        const inventoryUpdates = formattedCart.map((item) => ({
          productId: item.id,
          variantId: item.variantId,
          size: item.selectedSize,
          quantity: -Number.parseInt(item.quantity, 10),
        }));

        if (inventoryUpdates.length > 0) {
          try {
            await fetch("/api/orders/update-quantity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ updates: inventoryUpdates }),
            });
          } catch (error) {
            console.error(
              "Error updating inventory after order creation:",
              error
            );
          }
        }

        toast.success(`Order #${result.orderID} created successfully!`);
        closeAddModal();
        refetchOrders();
        setAddedProducts([]);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create order");
      }
    } catch (error) {
      toast.error("Error creating order");
      console.error("Error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={openAddModal}
          sx={{
            bgcolor: "#5db461",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "1.1rem",
            px: 4,
            py: 1.5,
            borderRadius: "12px",
            boxShadow: "0px 4px 20px rgba(93, 180, 97, 0.5)",
            textTransform: "none",
            transition: "all 0.3s ease",
            "&:hover": {
              bgcolor: "#4a9350",
              transform: "scale(1.05)",
              boxShadow: "0px 6px 24px rgba(74, 147, 80, 0.6)",
            },
          }}
        >
          + Add New Order
        </Button>
      </Box>

      {/* Search Input for Customer Phone Number */}

      <h1 className="flex items-center justify-center text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 relative">
        <span className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-md">
          Manual Orders (Only)
        </span>
      </h1>

      <SearchField
        phoneInput={phoneInput}
        setPhoneInput={setPhoneInput}
        handleNumberSearch={handleNumberSearch}
      />
      {orders?.length === 0 ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <h2 className="text-5xl font-semibold text-gray-600">
            No orders found
          </h2>
        </div>
      ) : (
        <>
          <TableContainer
            component={Paper}
            sx={{
              overflowX: "auto",
              width: "100%",
              maxWidth: "100vw",
              "& .MuiTableCell-root": {
                padding: { xs: "8px 4px", sm: "16px 8px", md: "16px" },
                fontSize: { xs: "0.75rem", sm: "0.875rem", md: "1rem" },
              },
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Added By</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders?.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <h1>
                        {order?.orderFrom === "facebook" ? (
                          <FaFacebook color="#1877F2" size={30} />
                        ) : order?.orderFrom === "wp" ? (
                          <FaWhatsapp color="#25D366" size={30} />
                        ) : order?.orderFrom === "insta" ? (
                          <FaInstagram color="#E1306C" size={30} />
                        ) : (
                          <FaGlobe color="#4285F4" size={30} />
                        )}
                      </h1>{" "}
                      {order.orderID}
                    </TableCell>
                    <TableCell>
                      {order?.formData?.name || "N/A"}
                      <br />
                      {order?.formData?.phone || "N/A"}
                      <br />
                      <Link
                        className="btn text-black bg-white border-black border w-full"
                        href={`/orders/${order?._id}`}
                      >
                        Slip
                      </Link>
                      <br />
                      <h1 className="text-center mt-2 text-green-400 font-bold">
                        {order?.lastDigits ?? "N/A"}
                      </h1>
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>৳{order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Select
                        className={
                          order?.status === "pending"
                            ? "bg-yellow-400"
                            : order?.status === "shipped"
                            ? "bg-blue-300"
                            : order?.status === "delivered"
                            ? "bg-green-400"
                            : order?.status === "exchange"
                            ? "bg-orange-400"
                            : order?.status === "confirmed"
                            ? "bg-purple-600 !text-white"
                            : order?.status === "returned"
                            ? "bg-red-400"
                            : order?.status === "refund"
                            ? "bg-[#AB47BC] !text-white" // ✅ New Refund color
                            : "bg-transparent" // Default for other statuses
                        }
                        value={updatedOrder[order?.orderID] || order?.status}
                        onChange={(e) =>
                          handleStatusChange(order?.orderID, e.target.value)
                        }
                        sx={{
                          minWidth: { xs: 80, sm: 100, md: 120 },
                          fontSize: {
                            xs: "0.75rem",
                            sm: "0.875rem",
                            md: "1rem",
                          },
                        }}
                      >
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="shipped">Shipped</MenuItem>
                        <MenuItem value="exchange">Exchange</MenuItem>
                        <MenuItem value="delivered">Delivered</MenuItem>
                        <MenuItem value="returned">Returned</MenuItem>
                        <MenuItem value="refund">Refund</MenuItem>{" "}
                        {/* ✅ Added Refund option */}
                      </Select>
                    </TableCell>
                    <TableCell>{order?.moderatorName ?? "N/A"}</TableCell>

                    <TableCell>
                      {order.cart?.map((item, idx) => (
                        <Box
                          key={idx}
                          display="flex"
                          alignItems="center"
                          mb={2}
                        >
                          {item?.imageUrl && item?.imageUrl?.length > 0 ? (
                            <Image
                              src={item?.imageUrl[0] || "/placeholder.svg"}
                              alt={item?.name || "Image"}
                              width={40}
                              height={40}
                              style={{ marginRight: 10, objectFit: "cover" }}
                            />
                          ) : (
                            <Box
                              width={40}
                              height={40}
                              sx={{
                                backgroundColor: "#f0f0f0",
                                marginRight: 1,
                              }}
                            />
                          )}
                          <Box>
                            <Typography variant="subtitle1">
                              {item.id}
                            </Typography>
                            {item?.selectedSize && (
                              <Typography variant="body2">
                                Size: {item?.selectedSize}
                              </Typography>
                            )}
                            <Typography variant="body2">
                              Variant: {item.variantId}
                            </Typography>
                            <Typography variant="body2">
                              Quantity: {item.quantity}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" gap={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{
                            padding: { xs: 1, sm: 2, md: 3 },
                            fontSize: {
                              xs: "0.75rem",
                              sm: "0.875rem",
                              md: "1rem",
                            },
                            bgcolor: "#5db461",
                            color: "#fff",
                            fontWeight: "600",
                          }}
                          onClick={() => handleSave(order.orderID)}
                          startIcon={<IoCheckmarkCircleOutline />}
                          disabled={disabledSave[order.orderID]}
                        >
                          Save
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          sx={{
                            padding: { xs: 1, sm: 2, md: 3 },
                            fontSize: {
                              xs: "0.75rem",
                              sm: "0.875rem",
                              md: "1rem",
                            },
                            fontWeight: "600",
                          }}
                          onClick={() => openEditModal(order)}
                          startIcon={<FiEdit />}
                        >
                          Edit
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          shape="rounded"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Edit Order Modal */}
      <EditOrderModal
        editModalOpen={editModalOpen}
        closeEditModal={closeEditModal}
        modalStyle={modalStyle}
        editingOrder={editingOrder}
        handleEditSubmit={handleEditSubmit}
        editFormData={editFormData}
        handlePhoneChange={handlePhoneChange}
        handleNotesChange={handleNotesChange}
        handleAddressFieldChange={handleAddressFieldChange}
        handleShippingCostChange={handleShippingCostChange}
        handleAdvancePaymentChange={handleAdvancePaymentChange}
        handleDiscountChange={handleDiscountChange}
        handleOrderFromChange={handleOrderFromChange}
        handleLastDigitsChange={handleLastDigitsChange}
        productSearchQuery={productSearchQuery}
        setProductSearchQuery={setProductSearchQuery}
        isTyping={isTyping}
        setIsTyping={setIsTyping}
        products={products}
        addProductToOrder={addProductToOrder}
        handleItemSizeChange={handleItemSizeChange}
        handleItemQuantityChange={handleItemQuantityChange}
        handleItemPriceChange={handleItemPriceChange}
        removeProductFromOrder={removeProductFromOrder}
        handleItemVariantChange={handleItemVariantChange}
      />
      {/* Add Order Modal */}
      <Box
        component="div"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: addModalOpen ? "flex" : "none",
          justifyContent: "center",
          alignItems: "center",
          overflow: "auto",
        }}
      >
        <Box
          component="div"
          sx={{
            ...modalStyle,
            width: { xs: "95%", sm: "90%", md: "80%" },
            maxWidth: "900px",
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom>
            Add New Order
          </Typography>
          <Box component="form" onSubmit={handleAddOrderSubmit}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Name"
                  fullWidth
                  value={newOrderData.formData.name}
                  onChange={(e) =>
                    handleNewOrderFormChange("name", e.target.value)
                  }
                  margin="normal"
                />
                <TextField
                  label="Phone"
                  fullWidth
                  required
                  value={newOrderData.formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    if (digits.length <= 11) {
                      handleNewOrderFormChange("phone", digits);
                    }
                  }}
                  inputProps={{
                    minLength: 11,
                    maxLength: 11,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  }}
                  error={
                    newOrderData.formData.phone.length > 0 &&
                    newOrderData.formData.phone.length < 11
                  }
                  helperText={
                    newOrderData.formData.phone.length > 0 &&
                    newOrderData.formData.phone.length < 11 &&
                    "Phone must be 11 digits"
                  }
                  margin="normal"
                />

                <TextField
                  label="Email"
                  fullWidth
                  value={newOrderData.formData.email}
                  onChange={(e) =>
                    handleNewOrderFormChange("email", e.target.value)
                  }
                  margin="normal"
                />
                <TextField
                  label="Street"
                  fullWidth
                  value={newOrderData.formData.street}
                  onChange={(e) =>
                    handleNewOrderFormChange("address", {
                      street: e.target.value,
                    })
                  }
                  margin="normal"
                />

                <TextField
                  label="Thana"
                  fullWidth
                  value={newOrderData.formData.thana}
                  onChange={(e) =>
                    handleNewOrderFormChange("address", {
                      thana: e.target.value,
                    })
                  }
                  margin="normal"
                />

                <TextField
                  label="Upazilla"
                  fullWidth
                  value={newOrderData.formData.upazilla}
                  onChange={(e) =>
                    handleNewOrderFormChange("address", {
                      upazilla: e.target.value,
                    })
                  }
                  margin="normal"
                />

                <Autocomplete
                  freeSolo
                  options={zillas}
                  value={newOrderData.formData.zilla || ""}
                  onChange={(e, newValue) =>
                    handleNewOrderFormChange("address", { zilla: newValue })
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Zilla"
                      fullWidth
                      margin="normal"
                      onChange={(e) =>
                        handleNewOrderFormChange("address", {
                          zilla: e.target.value,
                        })
                      }
                    />
                  )}
                />

                <TextField
                  label="Notes"
                  fullWidth
                  value={newOrderData.formData.notes}
                  onChange={(e) =>
                    handleNewOrderFormChange("notes", e.target.value)
                  }
                  margin="normal"
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Details
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  select
                  label="Payment Option"
                  fullWidth
                  value={newOrderData.paymentOption}
                  onChange={(e) =>
                    handleNewOrderFieldChange("paymentOption", e.target.value)
                  }
                  margin="normal"
                >
                  <MenuItem value="bkash">bKash</MenuItem>
                  <MenuItem value="nagad">Nagad</MenuItem>
                </TextField>
                <TextField
                  select
                  label="Shipping Option"
                  fullWidth
                  value={newOrderData.shippingOption}
                  onChange={(e) => handleShippingOptionChange(e.target.value)}
                  margin="normal"
                >
                  <MenuItem value="insideDhaka">Inside Dhaka</MenuItem>
                  <MenuItem value="dhakaSubCity">Dhaka Sub City</MenuItem>
                  <MenuItem value="outsideDhaka">Outside Dhaka</MenuItem>
                </TextField>
                <TextField
                  label="Shipping Cost"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  fullWidth
                  value={newOrderData.shippingCost}
                  onChange={(e) => {
                    const cost = Number.parseInt(e.target.value, 10) || 0;
                    const cartTotal = newOrderData.cart.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    );
                    const newTotal =
                      cartTotal +
                      cost -
                      newOrderData.discount -
                      newOrderData.advancePayment;

                    handleNewOrderFieldChange("shippingCost", cost);
                    handleNewOrderFieldChange("total", newTotal);
                  }}
                  margin="normal"
                />
                <TextField
                  select
                  label="Order From"
                  fullWidth
                  value={newOrderData.orderFrom}
                  onChange={(e) =>
                    handleNewOrderFieldChange("orderFrom", e.target.value)
                  }
                  margin="normal"
                >
                  <MenuItem value="">Website</MenuItem>
                  <MenuItem value="facebook">Facebook</MenuItem>
                  <MenuItem value="wp">WhatsApp</MenuItem>
                  <MenuItem value="insta">Instagram</MenuItem>
                </TextField>
                <TextField
                  label="Advance"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  fullWidth
                  value={
                    newOrderData.advancePayment === 0
                      ? ""
                      : newOrderData.advancePayment
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    // If input is empty, just set "" (don't force 0)
                    if (inputValue === "") {
                      handleNewOrderFieldChange("advancePayment", "");
                      handleNewOrderFieldChange(
                        "total",
                        newOrderData.cart.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) + newOrderData.shippingCost
                      );
                      return;
                    }

                    // Otherwise, parse as number
                    const advancePayment = Number.parseInt(inputValue, 10) || 0;
                    const cartTotal = newOrderData.cart.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    );
                    const newTotal =
                      cartTotal +
                      newOrderData.shippingCost -
                      advancePayment -
                      newOrderData.discount;

                    handleNewOrderFieldChange("advancePayment", advancePayment);
                    handleNewOrderFieldChange("total", newTotal);
                  }}
                  margin="normal"
                />

                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={newOrderData.status}
                  onChange={(e) =>
                    handleNewOrderFieldChange("status", e.target.value)
                  }
                  margin="normal"
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="returned">Returned</MenuItem>
                  <MenuItem value="exchange">Exchange</MenuItem>
                  <MenuItem value="refund">Refund</MenuItem>
                </TextField>

                <TextField
                  label="Discount"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  fullWidth
                  value={
                    newOrderData.discount === 0 ? "" : newOrderData.discount
                  }
                  onChange={(e) => {
                    const inputValue = e.target.value;

                    // If input is empty, clear discount but keep total intact
                    if (inputValue === "") {
                      handleNewOrderFieldChange("discount", "");
                      handleNewOrderFieldChange(
                        "total",
                        newOrderData.cart.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) + newOrderData.shippingCost
                      );
                      return;
                    }

                    // Otherwise, parse number and update
                    const discount = Number.parseInt(inputValue, 10) || 0;
                    const cartTotal = newOrderData.cart.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    );
                    const newTotal =
                      cartTotal +
                      newOrderData.shippingCost -
                      discount -
                      newOrderData.advancePayment;

                    handleNewOrderFieldChange("discount", discount);
                    handleNewOrderFieldChange("total", newTotal);
                  }}
                  margin="normal"
                />

                <TextField
                  label="Total"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  fullWidth
                  value={newOrderData.total}
                  onChange={(e) =>
                    handleNewOrderFieldChange(
                      "total",
                      Number.parseInt(e.target.value, 10) || 0
                    )
                  }
                  margin="normal"
                />
                <TextField
                  label="Last digits"
                  type="number"
                  onWheel={(e) => e.target.blur()}
                  fullWidth
                  value={newOrderData.lastDigits}
                  onChange={(e) => {
                    handleNewOrderFieldChange("lastDigits", e.target.value);
                  }}
                  margin="normal"
                />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              <TextField
                label="Search Products"
                fullWidth
                value={productSearchQuery}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setIsTyping(true);
                }}
                margin="normal"
              />

              {/* Product search results */}
              {products.length > 0 && (
                <Paper
                  sx={{ mt: 2, p: 2, maxHeight: "200px", overflow: "auto" }}
                >
                  {products.map((product) => {
                    const allSoldOut = checkSoldOut(product);

                    return (
                      <Box
                        key={product.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          position: "relative",
                          p: 1,
                          cursor: allSoldOut ? "not-allowed" : "pointer",
                          opacity: allSoldOut ? 0.6 : 1,
                          "&:hover": {
                            bgcolor: allSoldOut
                              ? "inherit"
                              : "rgba(0,0,0,0.05)",
                          },
                          borderBottom: "1px solid #eee",
                        }}
                        onClick={() =>
                          !allSoldOut && addProductToNewOrder(product)
                        }
                      >
                        {(product.imageUrl && product.imageUrl.length > 0) ||
                        product?.variants[0]?.images.length > 0 ? (
                          <Image
                            src={
                              product?.imageUrl
                                ? product?.imageUrl[0]
                                : product?.variants[0]?.images[0]
                            }
                            alt={product.name}
                            width={40}
                            height={40}
                            style={{ marginRight: 10, objectFit: "cover" }}
                          />
                        ) : (
                          <Box
                            width={40}
                            height={40}
                            sx={{ bgcolor: "#f0f0f0", mr: 1 }}
                          />
                        )}

                        {/* Small badge */}
                        {allSoldOut && (
                          <Typography
                            sx={{
                              position: "absolute",
                              top: 6,
                              right: 6,
                              bgcolor: "error.main",
                              color: "white",
                              px: 1,
                              py: "2px",
                              fontSize: "10px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                              fontWeight: "bold",
                            }}
                          >
                            Out of Stock
                          </Typography>
                        )}

                        <Box>
                          <Typography variant="subtitle1">
                            {product.name} - {product.id}
                          </Typography>
                          <Typography variant="body2">
                            Price: ৳{product.offerPrice || product.price}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Paper>
              )}

              {/* Selected products */}
              {newOrderData.cart.length > 0 ? (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Variant</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {newOrderData.cart.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {item.imageUrl && item.imageUrl.length > 0 ? (
                                <Image
                                  src={item.imageUrl[0] || "/placeholder.svg"}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  style={{
                                    marginRight: 10,
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <Box
                                  width={40}
                                  height={40}
                                  sx={{ bgcolor: "#f0f0f0", mr: 1 }}
                                />
                              )}
                              <Typography>
                                {item.name} - {item.id}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {item?.sizeType === "individual" ? (
                              <>
                                <Select
                                  value={item.selectedSize}
                                  onChange={(e) =>
                                    handleNewItemSizeChange(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  size="small"
                                >
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
                              </>
                            ) : (
                              <>
                                {item?.sizeType === "free" ? (
                                  <p>Free</p>
                                ) : (
                                  <p>None</p>
                                )}
                              </>
                            )}
                          </TableCell>

                          <TableCell>
                            <Select
                              value={item.variant}
                              onChange={(e) =>
                                handleNewItemVariantChange(
                                  index,
                                  e.target.value
                                )
                              }
                              size="small"
                            >
                              {item.variants.map((variant, index) => (
                                <MenuItem key={index} value={variant}>
                                  {variant.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>

                          <TableCell>
                            <TextField
                              type="number"
                              onWheel={(e) => e.target.blur()}
                              value={item.price}
                              onChange={(e) =>
                                handleNewItemPriceChange(index, e.target.value)
                              }
                              size="small"
                              sx={{ width: "80px" }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              onWheel={(e) => e.target.blur()}
                              value={item.quantity}
                              onChange={(e) =>
                                handleNewItemQuantityChange(
                                  index,
                                  e.target.value
                                )
                              }
                              size="small"
                              sx={{ width: "60px" }}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => removeProductFromNewOrder(index)}
                            >
                              Remove
                            </Button>

                            {addedProducts.map((product, index) => {
                              if (product.id === item.id) {
                                return (
                                  <Button
                                    key={index}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => addProductByOne(index)}
                                  >
                                    +1
                                  </Button>
                                );
                              }
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography sx={{ mt: 2, color: "text.secondary" }}>
                  No products added yet. Search and add products above.
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                mt: 3,
              }}
            >
              <Button variant="outlined" onClick={closeAddModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                sx={{
                  bgcolor: "#5db461",
                  color: "#fff",
                  fontWeight: "600",
                  "&:disabled": {
                    bgcolor: "#a5d6a8",
                    color: "#fff",
                  },
                }}
              >
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ManualEntryTable;
