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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Pagination } from "@mui/material";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FiEdit } from "react-icons/fi";
import toast from "react-hot-toast";
import Link from "next/link";
import { IoRefresh } from "react-icons/io5";
import { MdDeleteForever } from "react-icons/md";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import axios from "axios";
import EditOrderModal from "../../modals/EditOrderModal";
import { getParsedAddress } from "@/app/utils/getParsedAddress";
import SuccessRateModal from "../../modals/SuccessRateModal";
import { FaFacebook, FaGlobe, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { copyOrderSlip } from "@/app/lib/copyOrderSlip";
import cjIconUrl from "../../../../assets/cj1.png";
import qrImageUrl from "../../../../assets/cj2.png";
import fragilesUrl from "../../../../assets/cj3.png";
import logoUrl from "../../../../assets/cj4.png";
const OrdersTable = ({ loading, orders, totalPages, currentPage }) => {
  const [orderStatuses, setOrderStatuses] = useState({});
  const cacheRef = useRef(new Map()); // id -> status

  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "";
  const [orderType, setOrderType] = useState(type);

  // Initialize date states from URL parameters
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate")
      ? new Date(searchParams.get("startDate"))
      : null
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") ? new Date(searchParams.get("endDate")) : null
  );

  const [page, setPage] = useState(currentPage || 1);
  const [updatedOrder, setUpdatedOrder] = useState({});
  const [disabledSave, setDisabledSave] = useState({});
  const [initialStatus, setInitialStatus] = useState({});
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const router = useRouter();
  const statusFilter = searchParams.get("status") || "all";
  const [products, setProducts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  // Edit order modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
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
    orderFrom: "",
    lastDigits: "",
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    exchange: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
  });

  // Alternative approach using direct SVG or high-res canvas
  const handleDownloadWebInvoiceAlternative = async (order) => {
    try {
      const jsPDF = (await import("jspdf")).default;

      const pageWidth = 75; // mm
      const pageHeight = 100; // mm

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pageWidth, pageHeight],
        compress: false,
      });

      // --- Configuration Constants ---
      const margin = 3; // Overall margin from the page edges
      const contentWidth = pageWidth - 2 * margin;
      const sectionPadding = 2; // Padding inside each section border
      const lineHeight = 4; // Reduced vertical spacing for text lines

      // Helper to convert imported images to base64
      const convertImageToBase64 = async (imageSrc) => {
        try {
          // If it's already a string (URL), fetch it
          if (typeof imageSrc === "string") {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }

          // If it's an imported image object, use its src property
          if (imageSrc && typeof imageSrc === "object" && imageSrc.src) {
            const response = await fetch(imageSrc.src);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }

          return null;
        } catch (error) {
          console.error("Error converting image:", error);
          return null;
        }
      };

      // Load all images using local imports
      const cjIconBase64 = await convertImageToBase64(cjIconUrl);
      const qrImageBase64 = await convertImageToBase64(qrImageUrl);
      const fragilesBase64 = await convertImageToBase64(fragilesUrl);
      const logoBase64 = await convertImageToBase64(logoUrl);
      console.log(cjIconBase64);
      let currentY = margin; // Start drawing after the top margin

      // --- Draw Main Border ---
      pdf.setLineWidth(0.5);
      pdf.rect(margin, margin, contentWidth, pageHeight - 2 * margin);

      // --- Section 1: Top Logos ---
      const section1Height = 25;
      const section1StartY = currentY;
      currentY += sectionPadding; // Apply internal padding

      const cjIconWidth = 22; // Increased size
      const cjIconHeight = 22; // Increased size
      const qrWidth = 22; // Increased size
      const qrHeight = 22; // Increased size
      const spacing = (contentWidth - cjIconWidth - qrWidth) / 2;
      const cjIconX = margin + sectionPadding + spacing / 2;
      const qrX = pageWidth - margin - sectionPadding - qrWidth - spacing / 2;

      if (cjIconBase64) {
        pdf.addImage(
          cjIconBase64,
          "PNG",
          cjIconX,
          currentY,
          cjIconWidth,
          cjIconHeight
        );
      }
      if (qrImageBase64) {
        pdf.addImage(qrImageBase64, "PNG", qrX, currentY, qrWidth, qrHeight);
      }
      // Draw vertical partition line that connects to top and bottom borders
      const partitionX = pageWidth / 2;
      pdf.line(
        partitionX,
        section1StartY,
        partitionX,
        section1StartY + section1Height
      );

      currentY = section1StartY + section1Height; // Move Y to end of section
      pdf.rect(margin, section1StartY, contentWidth, section1Height); // Draw border for section 1

      // --- Section 2: Order ID ---
      const section2Height = 10;
      const section2StartY = currentY;
      currentY += sectionPadding; // Apply internal padding

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      const orderIdText = `ORDER NO-${order.orderID || "101"}`;
      pdf.text(orderIdText, pageWidth / 2, currentY + lineHeight, {
        align: "center",
      });
      currentY = section2StartY + section2Height; // Move Y to end of section
      pdf.rect(margin, section2StartY, contentWidth, section2Height); // Draw border for section 2

      // --- Section 3: Customer Info ---
      const section3Height = 18;
      const section3StartY = currentY;
      currentY += sectionPadding; // Apply internal padding

      const customerName = order.formData.name || "NAME NAME NAME";
      const customerPhone = order.formData.phone || "01999999999";
      pdf.setFontSize(16);
      pdf.text(customerName, pageWidth / 2, currentY + lineHeight, {
        align: "center",
      });
      pdf.setFontSize(16);
      pdf.text(customerPhone, pageWidth / 2, currentY + lineHeight * 2.5, {
        align: "center",
      }); // Increased gap
      currentY = section3StartY + section3Height; // Move Y to end of section
      pdf.rect(margin, section3StartY, contentWidth, section3Height); // Draw border for section 3

      // --- Section 4: Fragile Icons ---
      const section4Height = 15;
      const section4StartY = currentY;
      currentY += sectionPadding; // Apply internal padding

      if (fragilesBase64) {
        const iconsWidth = contentWidth - 2 * sectionPadding;
        const iconsHeightAdjusted = iconsWidth / (990 / 150);
        pdf.addImage(
          fragilesBase64,
          "PNG",
          margin + sectionPadding,
          currentY +
            (section4Height - iconsHeightAdjusted) / 2 -
            sectionPadding,
          iconsWidth,
          iconsHeightAdjusted
        );
      }
      currentY = section4StartY + section4Height; // Move Y to end of section
      pdf.rect(margin, section4StartY, contentWidth, section4Height); // Draw border for section 4

      // --- Section 5: Bottom Logo ---
      const section5Height = pageHeight - margin - currentY;
      const section5StartY = currentY;
      currentY += sectionPadding;

      if (logoBase64) {
        const logoMaxHeight = section5Height - 2 * sectionPadding;
        const logoWidthDesired = contentWidth - 2 * sectionPadding;
        const logoActualHeight = logoWidthDesired / (1520 / 220);

        let finalLogoWidth = logoWidthDesired;
        let finalLogoHeight = logoActualHeight;

        if (finalLogoHeight > logoMaxHeight) {
          finalLogoHeight = logoMaxHeight;
          finalLogoWidth = finalLogoHeight * (1520 / 220);
        }

        const xLogo =
          margin +
          sectionPadding +
          (contentWidth - 2 * sectionPadding - finalLogoWidth) / 2;
        const yLogo = currentY + (logoMaxHeight - finalLogoHeight) / 2;
        pdf.addImage(
          logoBase64,
          "PNG",
          xLogo,
          yLogo,
          finalLogoWidth,
          finalLogoHeight
        );
      }
      currentY = section5StartY + section5Height;
      pdf.rect(margin, section5StartY, contentWidth, section5Height);

      // Print the document
      pdf.autoPrint();
      const blobUrl = pdf.output("bloburl");
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      };

      console.log("Invoice ready for printing!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      console.log("Failed to generate invoice. Please try again.");
    }
  };
  const handleDirectHTMLPrint = (order) => {
    const printWindow = window.open("", "_blank");

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${order.orderID}</title>
      <style>
        @page {
  size: 75mm 100mm;
  margin: 4px;  /* adds white border around page */
}

        
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
        }
        
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          width: 75mm;
          height: 100mm;
        }
        
.invoice-container {
  width: 100%;
  height: 100%;
  border: 2px solid #000;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
        
        .section {
          border-bottom: 2px solid #000;
          padding: 6px;
        }
        
        .section:last-child {
          border-bottom: none;
          flex: 1;
        }
        
        .logo-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 25mm;
          position: relative;
        }
        
        .logo-section::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #000;
        }
        
        .logo-section img {
          width: 22mm;
          height: 22mm;
          object-fit: contain;
          margin-left: 20px;
          margin-right: 20px;
        }
        
        .order-id {
          text-align: center;
          font-weight: bold;
          font-size: 14px;
          padding: 8px 0;
        }
        
        .customer-info {
          text-align: center;
          padding: 8px 0;
        }
        
        .customer-name {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .customer-phone {
          font-size: 16px;
        }
        
        .fragile-section {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 15mm;
        }
        
        .fragile-section img {
          max-width: 95%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .bottom-logo {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 6px;
        }
        
        .bottom-logo img {
          max-width: 95%;
          max-height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Logo Section -->
        <div class="section logo-section">
        <div>
              <img src="${cjIconUrl.src || cjIconUrl}" alt="CJ Icon">
        </div>
        <div>
               <img src="${qrImageUrl.src || qrImageUrl}" alt="Logo"></div>   
        </div>
        
        <!-- Order ID Section -->
        <div class="section order-id">
          ORDER NO-${order.orderID || "101"}
        </div>
        
        <!-- Customer Info Section -->
        <div class="section customer-info">
          <div class="customer-name">${
            order.formData.name || "NAME NAME NAME"
          }</div>
          <div class="customer-phone">${
            order.formData.phone || "01999999999"
          }</div>
        </div>
        
        <!-- Fragile Icons Section -->
        <div class="section fragile-section">
          <img src="${fragilesUrl.src || fragilesUrl}" alt="Fragile">
        </div>
        
        <!-- Bottom Logo Section -->
        <div class="section bottom-logo">
          <img src="${logoUrl.src || logoUrl}" alt="Logo">
        </div>
      </div>
      
      <script>
        // Auto-print when loaded
        window.onload = () => {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  // Fetch total counts from all-orders API
  const fetchTotalCounts = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.set("type", orderType === "" ? "all" : orderType);

      // Add date filters to the counts query
      if (startDate) {
        queryParams.set("startDate", startDate);
      }
      if (endDate) {
        queryParams.set("endDate", endDate);
      }

      const response = await fetch(`/api/all-orders?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch counts");
      const data = await response.json();
      const allOrders = data.orders || [];

      // Calculate counts using the same logic as sales-analytics
      const pendingOrders = allOrders.filter(
        (order) => order.status === "pending"
      );
      const exchangeOrders = allOrders.filter(
        (order) => order.status === "exchange"
      );
      const confirmedOrders = allOrders.filter(
        (order) => order.status === "confirmed"
      );
      const shippedOrders = allOrders.filter(
        (order) => order.status === "shipped"
      );
      const deliveredOrders = allOrders.filter(
        (order) => order.status === "delivered"
      );
      const returnedOrders = allOrders.filter(
        (order) => order.status === "returned"
      );

      setStatusCounts({
        all: allOrders.length,
        pending: pendingOrders.length,
        exchange: exchangeOrders.length,
        confirmed: confirmedOrders.length,
        shipped: shippedOrders.length,
        delivered: deliveredOrders.length,
        returned: returnedOrders.length,
      });
    } catch (error) {
      console.error("Error fetching order counts:", error);
    }
  };

  // Fetch counts on component mount and when orders change
  useEffect(() => {
    fetchTotalCounts();
  }, [orders]);

  useEffect(() => {
    const statusMap = {};
    const disabledMap = {};
    orders?.forEach((order) => {
      statusMap[order.orderID] = order.status;
      disabledMap[order.orderID] = true; // Initially, disable the Save button
    });
    setInitialStatus(statusMap);
    setDisabledSave(disabledMap);
  }, [orders]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);

    const query = new URLSearchParams();
    query.set("page", newPage);
    query.set("status", statusFilter);

    if (orderType) {
      query.set("type", orderType);
    }

    // Preserve date filters when changing pages
    if (startDate) {
      query.set("startDate", startDate);
    }
    if (endDate) {
      query.set("endDate", endDate);
    }

    router.push(`/dashboard/all-orders?${query.toString()}`);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setUpdatedOrder((prev) => ({ ...prev, [orderId]: newStatus }));
    setDisabledSave((prev) => ({
      ...prev,
      [orderId]: initialStatus[orderId] === newStatus,
    }));
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
          // Get the order details
          const orderDetails = orders.find(
            (order) => order.orderID === orderId
          );
          console.log(orderDetails?.formData?.address);
          if (updatedStatus === "confirmed") {
            const parsedAddress = await getParsedAddress(
              orderDetails?.formData?.address
            );

            if (!parsedAddress) {
              console.error("Failed to parse address");
              return;
            }

            const pathaoResponse = await fetch("/api/pathao-entry", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...orderDetails,
                parsedAddress, // pass this separately
              }),
            });
            const entryResponse = await pathaoResponse.json();

            if (pathaoResponse?.ok) {
              toast.success("Order entried in Pathao successfully!");
              const editResponse = await fetch(`/api/edit-order/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  consignment_id: entryResponse?.data?.consignment_id || "",
                }),
              });
              return;
            } else {
              toast.error("Failed to enter order in Pathao");
              return;
            }
          } else {
            toast.success("Order status updated successfully!");
          }

          // Handle inventory updates based on status changee
          if (updatedStatus === "returned" && originalStatus !== "returned") {
            // If order is being returned, add quantities back to inventory
            const quantityUpdates = orderDetails.cart?.map((item) => ({
              productId: item.id,
              size: item.selectedSize,
              quantity: Number.parseInt(item.quantity, 10), // Positive to add back to inventory
            }));

            await fetch("/api/orders/update-quantity", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ updates: quantityUpdates }),
            });
          }

          setInitialStatus((prev) => ({ ...prev, [orderId]: updatedStatus }));
          setDisabledSave((prev) => ({ ...prev, [orderId]: true }));

          // Refresh the page data
          router.refresh();
        } else {
          toast.error("Failed to update order status");
        }
      }
    } catch (error) {
      toast.error("Error updating order status");
      console.error("Error:", error);
    }
  };

  const handleStatusFilter = (status) => {
    const query = new URLSearchParams();
    query.set("status", status);
    query.set("page", "1"); // Reset to first page when changing status

    if (orderType) {
      query.set("type", orderType);
    }

    // Preserve date filters when changing status
    if (startDate) {
      query.set("startDate", startDate);
    }
    if (endDate) {
      query.set("endDate", endDate);
    }

    router.push(`/dashboard/all-orders?${query.toString()}`);
    router.refresh();
  };

  const handleNumberSearch = (phone) => {
    const query = new URLSearchParams();
    query.set("page", "1"); // Reset to first page when changing type
    if (orderType) {
      query.set("type", orderType);
    }
    if (phone) {
      query.set("phone", phone);
    }

    router.push(`/dashboard/all-orders?${query.toString()}`);
  };

  const handleTypeFilter = (type) => {
    setOrderType(type);
    const query = new URLSearchParams();
    query.set("page", "1"); // Reset to first page when changing type
    setPhoneInput(""); // ✅ clear phone input

    if (type === "manual" || type === "web") {
      query.set("type", type);
    }

    // Preserve date filters when changing type
    if (startDate) {
      query.set("startDate", startDate);
    }
    if (endDate) {
      query.set("endDate", endDate);
    }

    router.push(`/dashboard/all-orders?${query.toString()}`);
  };

  const handleDateFilter = () => {
    const query = new URLSearchParams();

    // Add existing filters
    query.set("status", statusFilter);
    if (orderType) {
      query.set("type", orderType);
    }

    // Add date filters
    if (startDate) {
      query.set("startDate", startDate);
    }
    if (endDate) {
      query.set("endDate", endDate);
    }

    // Keep the current page when applying filters
    query.set("page", page);

    router.push(`/dashboard/all-orders?${query.toString()}`);
    router.refresh();
  };

  const clearDateFilter = () => {
    setStartDate(null);
    setEndDate(null);

    const query = new URLSearchParams();
    query.set("status", statusFilter);
    if (orderType) {
      query.set("type", orderType);
    }
    // Keep the current page when clearing filters
    query.set("page", page);

    router.push(`/dashboard/all-orders?${query.toString()}`);
    router.refresh();
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
      consignment_id: order?.consignment_id,
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

  const handleNotesChange = (e) => {
    setEditFormData({
      ...editFormData,
      notes: e.target.value,
    });
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
    const newTotal = cartTotal + shippingCost;

    setEditFormData({
      ...editFormData,
      shippingCost: shippingCost,
      total: newTotal,
    });
  };

  const handleConsignmentChange = (value) => {
    console.log(value);
    setEditFormData({
      ...editFormData,
      consignment_id: value,
    });
  };

  const handleTotalChange = (value) => {
    const totalV = Number.parseInt(value, 10) || 0;
    setEditFormData({
      ...editFormData,
      total: totalV,
    });
  };

  const handleItemQuantityChange = (index, value) => {
    const newCart = [...editFormData.cart];
    const newQuantity = Number.parseInt(value, 10) || 0;
    newCart[index].quantity = newQuantity;

    // Recalculate total
    const cartTotal = calculateTotal(newCart);
    const newTotal = cartTotal + editFormData.shippingCost;

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

  // Add function to handle price changes for individual items
  const handleItemPriceChange = (index, value) => {
    const newCart = [...editFormData.cart];
    const newPrice = Number.parseFloat(value) || 0;
    newCart[index].price = newPrice;

    // Recalculate total
    const cartTotal = calculateTotal(newCart);
    const newTotal = cartTotal + editFormData.shippingCost;

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
    if (!productSearchQuery.trim()) return; // Prevent API call for empty queries

    try {
      const response = await axios.get(`/api/products`, {
        params: { name: productSearchQuery },
      });

      setProducts(response.data.orders || []); // Ensure correct data mapping
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
      const newTotal = cartTotal + editFormData.shippingCost;

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
      const newTotal = cartTotal + editFormData.shippingCost;

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

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { xs: "90%", sm: "80%", md: "70%" },
    maxWidth: 800,
    maxHeight: "90vh",
    overflow: "auto",
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 2,
    borderRadius: 2,
  };

  // Add a new function to handle product removal
  const removeProductFromOrder = (index) => {
    // Create a copy of the cart without the removed item
    const newCart = editFormData.cart.filter((_, i) => i !== index);

    // Recalculate total with shipping cost
    const cartTotal = calculateTotal(newCart);
    const newTotal = cartTotal + editFormData.shippingCost;

    setEditFormData({
      ...editFormData,
      cart: newCart,
      total: newTotal,
    });
  };

  const handleDelete = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Order deleted successfully!");
        router.refresh(); // Refresh the page data
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to delete order");
      }
    } catch (error) {
      toast.error("Error deleting order");
      console.error("Error:", error);
    }
  };

  const confirmDelete = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (orderToDelete) {
      await handleDelete(orderToDelete.orderID);
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    }
  };

  // Update handleRefresh to also refresh counts
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      await router.refresh();
      await fetchTotalCounts();
      toast.success("Orders refreshed successfully!");
    } catch (error) {
      toast.error("Error refreshing orders");
      console.error("Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  //handleDownloadInvoice

  const handleDownloadInvoice = async (consignment_id) => {
    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          consignments: [`${consignment_id}`],
        }),
      });

      const contentType = response.headers.get("Content-Type");

      if (response.ok && contentType === "application/pdf") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "invoice.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          toast.error(errorJson.message || "Failed to download invoice");
        } catch {
          toast.error("Unexpected response from server");
          console.error("Raw error response:", errorText);
        }
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleCopy = async (orderID) => {
    const result = await copyOrderSlip(orderID);
    toast.success(result.message); // or use toast
  };

  // Add a new useEffect to fetch order statuses
  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      // debounce a bit so fast flips don't blast the API
      await wait(200);
      if (cancelled) return;

      const uniqIds = Array.from(
        new Set((orders || []).map((o) => o?.consignment_id).filter(Boolean))
      );

      const updates = {};

      for (const id of uniqIds) {
        if (cancelled) break;

        // use client cache first
        if (cacheRef.current.has(id)) {
          updates[id] = cacheRef.current.get(id);
          continue;
        }

        try {
          const res = await fetch(
            `/api/get-order-status?id=${encodeURIComponent(id)}`,
            {
              signal: ac.signal,
            }
          );
          const data = await res.json();

          if (res.ok) {
            const status = data?.order_status || "Unknown";
            cacheRef.current.set(id, status);
            updates[id] = status;
          } else {
            // if rate limited, pause briefly and keep going
            if (res.status === 429) await wait(600);
            updates[id] = "—"; // soft-fail placeholder
          }
        } catch {
          if (!cancelled) updates[id] = "—";
        }

        // tiny gap between requests (prevents bursts)
        await wait(120);
      }

      if (!cancelled && Object.keys(updates).length) {
        setOrderStatuses((prev) => ({ ...prev, ...updates }));
      }
    };

    run();

    return () => {
      cancelled = true;
      ac.abort(); // stop in-flight requests when page/filter changes
    };
  }, [orders]);

  return (
    <Box>
      <Stack direction="row" spacing={2} mb={3}>
        <button
          onClick={() => handleTypeFilter("")}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 border 
      ${
        orderType === ""
          ? "bg-black text-white shadow-md border-black"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
      }`}
        >
          All Orders
        </button>
        <button
          onClick={() => handleTypeFilter("web")}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 border 
      ${
        orderType === "web"
          ? "bg-black text-white shadow-md border-black"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
      }`}
        >
          Website Orders
        </button>

        <button
          onClick={() => handleTypeFilter("manual")}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 border 
      ${
        orderType === "manual"
          ? "bg-black text-white shadow-md border-black"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
      }`}
        >
          Manual Orders
        </button>
      </Stack>

      {/* Status Filter Buttons */}
      <Box mb={3} display="flex" justifyContent="flex-start">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              sm: "repeat(6, auto)",
            },
            gap: 1,
            width: "100%",
          }}
        >
          <Button
            onClick={() => handleStatusFilter("all")}
            variant={statusFilter === "all" ? "contained" : "outlined"}
            fullWidth
          >
            All ({statusCounts.all})
          </Button>
          <Button
            onClick={() => handleStatusFilter("pending")}
            variant={statusFilter === "pending" ? "contained" : "outlined"}
            sx={{ bgcolor: statusFilter === "pending" ? "#FFC107" : "inherit" }}
            fullWidth
          >
            Pending ({statusCounts.pending})
          </Button>
          <Button
            onClick={() => handleStatusFilter("confirmed")}
            variant={statusFilter === "confirmed" ? "contained" : "outlined"}
            sx={{
              bgcolor: statusFilter === "confirmed" ? "#FFC107" : "inherit",
            }}
            fullWidth
          >
            Confirmed ({statusCounts.confirmed})
          </Button>
          <Button
            onClick={() => handleStatusFilter("shipped")}
            variant={statusFilter === "shipped" ? "contained" : "outlined"}
            sx={{ bgcolor: statusFilter === "shipped" ? "#90CAF9" : "inherit" }}
            fullWidth
          >
            Shipped ({statusCounts.shipped})
          </Button>
          <Button
            onClick={() => handleStatusFilter("delivered")}
            variant={statusFilter === "delivered" ? "contained" : "outlined"}
            sx={{
              bgcolor: statusFilter === "delivered" ? "#66BB6A" : "inherit",
            }}
            fullWidth
          >
            Delivered ({statusCounts.delivered})
          </Button>
          <Button
            onClick={() => handleStatusFilter("exchange")}
            variant={statusFilter === "exchange" ? "contained" : "outlined"}
            sx={{
              bgcolor: statusFilter === "exchange" ? "#EF5350" : "inherit",
              color: statusFilter === "exchange" ? "white" : "inherit",
            }}
            fullWidth
          >
            exchange ({statusCounts.exchange})
          </Button>
          <Button
            onClick={() => handleStatusFilter("returned")}
            variant={statusFilter === "returned" ? "contained" : "outlined"}
            sx={{
              bgcolor: statusFilter === "returned" ? "#EF5350" : "inherit",
              color: statusFilter === "returned" ? "white" : "inherit",
            }}
            fullWidth
          >
            Returned ({statusCounts.returned})
          </Button>
        </Box>
      </Box>

      {/* Date Filter Section */}
      <Box
        mb={3}
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
              width: "100%",
            }}
          >
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                },
              }}
            />
          </Box>
        </LocalizationProvider>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            width: "100%",
          }}
        >
          <Button
            variant="contained"
            onClick={handleDateFilter}
            fullWidth
            sx={{
              bgcolor: "#5db461",
              "&:hover": { bgcolor: "#4a8f4d" },
            }}
          >
            Apply Date Filter
          </Button>
          <Button variant="outlined" onClick={clearDateFilter} fullWidth>
            Clear Dates
          </Button>
        </Box>
      </Box>

      {/* Search Input for Customer Phone Number */}
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <TextField
          label="Search by Customer Phone"
          variant="outlined"
          value={phoneInput}
          onChange={(e) => {
            const value = e.target.value;
            setPhoneInput(value);
            handleNumberSearch(value);
          }}
          sx={{ width: "100%", maxWidth: 300 }}
        />
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 border 
          bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2
          ${isRefreshing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <IoRefresh
            className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </Box>

      <h1 className="flex items-center justify-center text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 relative">
        <span className="inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text drop-shadow-md">
          {orderType === "manual"
            ? "Manual Orders"
            : orderType === "web"
            ? "Website Orders"
            : "All Orders"}
        </span>
      </h1>

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
              <TableCell>Items</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="">
                  <h1 className="py-20 text-4xl font-bold">Loading</h1>
                </TableCell>
              </TableRow>
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="">
                  <h1 className="py-20 text-4xl font-bold">No orders found</h1>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {orders?.map((order) => (
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
                      <button
                        onClick={() => handleCopy(order?._id)}
                        className="p-2 my-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Copy Order Slip
                      </button>
                      <h1 className="text-center  text-green-400 font-bold">
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
                            : "bg-transparent" // For other statuses
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
                      </Select>
                      <div className="flex items-center justify-center mt-1">
                        {order?.consignment_id ? (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold capitalize text-center
                    ${
                      orderStatuses[order.consignment_id] === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : orderStatuses[order.consignment_id] === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : order?.status === "exchange"
                        ? "bg-orange-400"
                        : orderStatuses[order.consignment_id] === "Return"
                        ? "bg-red-100 text-red-700"
                        : orderStatuses[order.consignment_id] === "Paid Return"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-800"
                    }`}
                          >
                            {orderStatuses[order.consignment_id] ||
                              "Loading..."}
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <SuccessRateModal phoneNumber={order?.formData?.phone} />
                    </TableCell>

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
                              {item.name}
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
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-md transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 text-xs sm:text-sm"
                          onClick={() => handleDirectHTMLPrint(order)}
                        >
                          Download CJ Invoice
                        </Button>
                        {order?.consignment_id && (
                          <>
                            <Button
                              variant="contained"
                              color="primary"
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-md transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 text-xs sm:text-sm"
                              onClick={() =>
                                handleDownloadInvoice(order?.consignment_id)
                              }
                            >
                              Download Pathao Invoice
                            </Button>
                          </>
                        )}
                        <Button
                          variant="contained"
                          color="primary"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-md transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 disabled:transform-none disabled:shadow-none text-xs sm:text-sm md:text-base"
                          onClick={() => handleSave(order.orderID)}
                          disabled={disabledSave[order.orderID]}
                        >
                          Save
                        </Button>

                        <Button
                          variant="outlined"
                          color="primary"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-amber-50 text-amber-700 font-medium rounded-md border border-amber-300 hover:border-amber-400 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 text-xs sm:text-sm md:text-base"
                          onClick={() => openEditModal(order)}
                          startIcon={<FiEdit />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-700 font-medium rounded-md border border-red-300 hover:border-red-400 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md active:scale-95 text-xs sm:text-sm md:text-base"
                          onClick={() => confirmDelete(order)}
                          startIcon={<MdDeleteForever />}
                        >
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this order? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};

export default OrdersTable;
