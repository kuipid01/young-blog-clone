"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Facebook,
  Download,
  Eye,
  Search,
  Filter,
  ChevronDown,
  X,
  Upload, // Import Upload icon
  Package, // Moved Package here
  Copy,    // Moved Copy here
} from "lucide-react";
import { toast } from "sonner";
import { useGetLoggedInUserId } from "../app/utils/getloggedinuser";
import { Separator } from "./ui/separator";
import { uploadToCloudinary } from "../app/utils/upload-to-cloundinary"; // Import Cloudinary util


// Define a type for an Order to improve type safety (optional but good practice)
interface Order {
  id: string;
  productId?: string;
  product: {
    name: string;
    price: string;
    stock: string;
    category: string;
    inStock: string;
  };
  log: {
    id: string;
    logDetails: string;
    status: "used" | "unused";
  };
  format: string;
  data: string[];
  quantity: number;
  totalPrice: number;
  status: "completed" | "pending" | "failed" | "refund_pending" | "refunded" | "denied";
  createdAt: string;
  refundReason?: string;
  refundProof?: string;
}

// Mock Data

// --- Helper Functions ---

/**
 * Downloads the content of a single order as a text file.
 * @param order The order object to download.
 */
const downloadOrder = (order: Order) => {
  if (order.status !== "completed") {
    alert("This order is not completed and cannot be downloaded.");
    return;
  }

  // Create a string representation of the order data (e.g., in CSV or plain text format)
  // For a real-world scenario, you might download the actual accounts data, but here we mock the file content.
  const fileContent = `
Order ID: ${order.id}
Product: ${order.product}
Format: ${order.format}
Price per unit: ₦${order.totalPrice.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}
Quantity: ${order.quantity}
Total Price: ₦${order.totalPrice.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
  })}
Date: ${order.createdAt}


... (up to ${order.quantity} accounts)
  `.trim();

  const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${order.id}_${order?.product?.name
    .substring(0, 30)
    .replace(/[^a-z0-9]/gi, "_")}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Component ---

export function OrdersContent() {
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  const { userId } = useGetLoggedInUserId();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // State for View Details modal

  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundOrder, setRefundOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refundProofFile, setRefundProofFile] = useState<File | null>(null);
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);

  // Multi-step refund state
  const [refundStep, setRefundStep] = useState<1 | 2 | 3>(1);
  const [faultyCount, setFaultyCount] = useState(1);
  const [faultyItems, setFaultyItems] = useState<{ logContent: string; proofFile: File | null }[]>(
    [{ logContent: "", proofFile: null }]
  );





  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  useEffect(() => {
    // 1. Set a flag to confirm we are on the client
    setIsClient(true);

    // 2. Access localStorage only inside useEffect
    try {
      const storedProducts = localStorage.getItem("shopProducts");

      // Handle case where item might be null or empty string
      const parsedProducts = storedProducts ? JSON.parse(storedProducts) : [];

      setShopProducts(parsedProducts);
    } catch (e) {
      console.error("Failed to parse shopProducts from localStorage", e);
      setShopProducts([]); // Default to an empty array on error
    }
  }, []);
  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Completed
          </span>
        );
      case "pending":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Failed
          </span>
        );
      case "refund_pending":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700">
            Refund Pending
          </span>
        );
      case "refunded":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
            Refunded
          </span>
        );
      case "denied":
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
            Refund Denied
          </span>
        );
      default:
        return null;
    }
  };
  const getProductFromLS = (productId: string) => {
    return shopProducts.find(
      (product: { id: string }) => product.id === productId
    );
  };
  useEffect(() => {
    // wait until userId is set
    if (!userId) {
      // if userId is null (meaning not logged in) we don't attempt fetch
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchOrders() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/orders/${userId}`, {
          method: "GET",
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.message || "Failed to fetch orders.");
          if (!cancelled) setOrders([]);
          return;
        }

        if (!cancelled) setOrders(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        toast.error("An unexpected error occurred while loading orders.");
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [userId]);

  const totalSpent = orders
    ?.filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.totalPrice), 0);
  const totalOrders = orders?.length;
  const completedOrders = orders?.filter(
    (o) => o.status === "completed"
  ).length;

  const openViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const closeViewDetails = () => {
    setSelectedOrder(null);
  };

  const openRefundModal = (order: Order) => {
    setRefundOrder(order);
    setRefundReason("");
    setRefundProofFile(null);
    setRefundStep(1);
    setFaultyCount(1);
    setFaultyItems([{ logContent: "", proofFile: null }]);
    setIsRefundModalOpen(true);
    // Close detail view if open
    setSelectedOrder(null);
  };




  const closeRefundModal = () => {
    setIsRefundModalOpen(false);
    setRefundOrder(null);
  };


  const handleRefundSubmit = async () => {
    if (!refundOrder || !refundReason.trim()) {
      toast.error("Please describe the issue before submitting.");
      return;
    }
    const hasEmpty = faultyItems.some((item) => !item.logContent.trim());
    if (hasEmpty) {
      toast.error("Please paste the log content for every faulty log.");
      return;
    }

    setIsRefundSubmitting(true);
    try {
      // Upload each proof file to Cloudinary in parallel
      const uploadedItems = await Promise.all(
        faultyItems.map(async (item) => {
          let proofUrl = "";
          if (item.proofFile) {
            proofUrl = await uploadToCloudinary(item.proofFile);
          }
          return { logContent: item.logContent.trim(), proofUrl };
        })
      );

      const res = await fetch("/api/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          orderId: refundOrder.id,
          reason: refundReason,
          faultyItems: uploadedItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Refund request failed.");

      toast.success(`Refund request submitted! ${faultyCount} of ${refundOrder.quantity} logs reported.`);

      // Optimistic UI update
      if (orders) {
        setOrders(
          orders.map((o) =>
            o.id === refundOrder.id ? { ...o, status: "refund_pending" } : o
          )
        );
      }
      closeRefundModal();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsRefundSubmitting(false);
    }
  };

  // --- Rendering Logic ---
  const handleCopy = () => {
    navigator.clipboard
      .writeText(
        selectedOrder?.data.join("") || selectedOrder?.log?.logDetails || ""
      )
      .then(() => {
        toast.success("Log copied to clipboard!");
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy log.");
      });
  };
  const logDetails =
    selectedOrder?.log?.logDetails || selectedOrder?.data?.join("") || "";
  // console.log("ORDERS",filteredOrders);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500 mt-1">
          View and manage your purchase history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Completed Orders</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {completedOrders}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Spent</p>
          <p className="text-2xl font-bold text-violet-600 mt-1">
            ₦{totalSpent?.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as Order["status"] | "all")
              }
              className="appearance-none pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refund_pending">Refund Pending</option>
              <option value="refunded">Refunded</option>
              <option value="denied">Refund Denied</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">
                  ORDER ID
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  PRODUCT
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">
                  QTY
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">
                  TOTAL
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600 whitespace-nowrap">
                  DATE
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  STATUS
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders?.length && filteredOrders?.length > 0 ? (
                filteredOrders?.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors ${["refund_pending", "refunded", "denied"].includes(order.status) ? "opacity-60 bg-gray-50/50" : ""
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-violet-600">
                        {order?.id}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3 max-w-md">
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {order?.product?.name ??
                              getProductFromLS(order?.productId!)?.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {order?.format}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {order?.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        ₦
                        {order?.totalPrice?.toLocaleString("en-NG", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {order?.createdAt && (
                          <span>
                            {new Date(order?.createdAt).toLocaleString()}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order?.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {/* View Details Button - Triggers a modal */}
                        <button
                          onClick={() => openViewDetails(order)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        {/* Download Button - Only for completed orders */}
                        {order?.status === "completed" && (
                          <button
                            onClick={() => downloadOrder(order)}
                            className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4 text-violet-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-500">
                      No orders found matching your criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal (View Details Feature) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-h-[80vh] overflow-y-auto max-w-lg">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Order Details: {selectedOrder?.id}
              </h3>
              <button
                onClick={closeViewDetails}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Product</p>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedOrder?.product?.name ??
                      getProductFromLS(selectedOrder?.productId!)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Order Status
                  </p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base text-gray-700">
                    {selectedOrder?.createdAt && (
                      <span>
                        {new Date(selectedOrder.createdAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Quantity</p>
                  <p className="text-base text-gray-700">
                    {selectedOrder.quantity}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Price/Unit
                  </p>
                  <p className="text-base text-gray-700">
                    ₦
                    {selectedOrder?.totalPrice.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Amount
                  </p>
                  <p className="text-xl font-bold text-violet-600">
                    ₦
                    {selectedOrder.totalPrice.toLocaleString("en-NG", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="text-left  bg-gray-50 dark:bg-gray-800 p-4 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <h1 className="text-lg font-semibold flex items-center gap-2 text-primary/80">
                    <Package className="w-4 h-4" /> Log Details:
                  </h1>

                  {/* 📋 The Copy Button */}
                  <button
                    onClick={handleCopy}
                    aria-label="Copy log details"
                    className="p-1 cursor-pointer rounded-md text-primary/60 hover:text-primary hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-mono text-wrap break-all  text-gray-700 dark:text-gray-300">
                  {logDetails}{" "}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeViewDetails}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedOrder.status === "completed" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      downloadOrder(selectedOrder);
                      closeViewDetails();
                    }}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download Order
                  </button>
                  <button
                    onClick={() => openRefundModal(selectedOrder)}
                    className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Request Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Refund Request Modal (3-step flow) ── */}
      {isRefundModalOpen && refundOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Request Refund</h3>
                <p className="text-xs text-gray-400 mt-0.5 font-mono">Order #{refundOrder.id}</p>
              </div>
              <button onClick={closeRefundModal} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 pt-5 flex-shrink-0">
              <div className="flex items-center gap-1">
                {(["Select Faulty Logs", "Log Details", "Confirm & Submit"] as const).map(
                  (label, i) => {
                    const step = (i + 1) as 1 | 2 | 3;
                    const active = refundStep === step;
                    const done = refundStep > step;
                    return (
                      <div key={step} className="flex items-center gap-1 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                          done ? "bg-green-500 text-white" :
                          active ? "bg-red-600 text-white" :
                          "bg-gray-200 text-gray-500"
                        }`}>
                          {done ? "✓" : step}
                        </div>
                        <span className={`text-xs hidden sm:block truncate ${
                          active ? "text-red-600 font-semibold" :
                          done ? "text-green-600" : "text-gray-400"
                        }`}>{label}</span>
                        {step < 3 && (
                          <div className={`h-0.5 flex-1 transition-colors ${
                            done ? "bg-green-400" : "bg-gray-200"
                          }`} />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── Step 1: Choose faulty count ── */}
              {refundStep === 1 && (
                <div className="p-6 space-y-5">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-orange-800">⚠️ Partial Refund Policy</p>
                    <p className="text-xs text-orange-700 mt-1">
                      You will only be refunded for logs that are proven faulty.
                      Select exactly how many logs from this order are not working.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Product</span>
                      <span className="font-semibold text-gray-800">{refundOrder.product?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Logs ordered</span>
                      <span className="font-semibold text-gray-800">{refundOrder.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total paid</span>
                      <span className="font-semibold text-gray-800">
                        ₦{Number(refundOrder.totalPrice).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How many of the {refundOrder.quantity} log(s) are faulty?{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: refundOrder.quantity }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            setFaultyCount(num);
                            setFaultyItems(
                              Array.from({ length: num }, (_, i) =>
                                faultyItems[i] ?? { logContent: "", proofFile: null }
                              )
                            );
                          }}
                          className={`w-12 h-12 rounded-lg border-2 font-bold text-base transition-all ${
                            faultyCount === num
                              ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                              : "border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50/50"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Reporting{" "}
                      <span className="font-semibold text-red-600">{faultyCount}</span>
                      {" "}of{" "}
                      <span className="font-semibold">{refundOrder.quantity}</span>
                      {" "}log(s) —{" "}
                      Estimated refund:{" "}
                      <span className="font-semibold text-green-600">
                        ₦{((faultyCount / refundOrder.quantity) * Number(refundOrder.totalPrice)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 2: Per-log content + proof ── */}
              {refundStep === 2 && (
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600">
                    You reported{" "}
                    <span className="font-semibold text-red-600">{faultyCount}</span>
                    {" "}faulty log(s). For each one, paste the exact log content and optionally
                    upload a screenshot as proof.
                  </p>

                  {faultyItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50"
                    >
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        Faulty Log #{idx + 1}
                      </h4>

                      {/* Log content textarea */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Paste the faulty log content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={item.logContent}
                          onChange={(e) => {
                            const updated = [...faultyItems];
                            updated[idx] = { ...updated[idx], logContent: e.target.value };
                            setFaultyItems(updated);
                          }}
                          placeholder="Paste the exact log / credentials that are not working..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent min-h-[90px] text-sm font-mono resize-none"
                        />
                      </div>

                      {/* Proof upload */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Screenshot / proof{" "}
                          <span className="text-gray-400">(optional but recommended)</span>
                        </label>
                        <div
                          className={`border-2 border-dashed rounded-lg p-3 text-center hover:bg-gray-50 transition-colors cursor-pointer relative ${
                            item.proofFile
                              ? "border-green-400 bg-green-50"
                              : "border-gray-300"
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                const updated = [...faultyItems];
                                updated[idx] = { ...updated[idx], proofFile: e.target.files![0] };
                                setFaultyItems(updated);
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs">
                              {item.proofFile ? (
                                <span className="text-green-600 font-medium">✓ {item.proofFile.name}</span>
                              ) : (
                                <span className="text-gray-500">Click to upload screenshot</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Step 3: General reason + summary ── */}
              {refundStep === 3 && (
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      General description of the issue <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Describe the issue (e.g. 'These accounts were already used / locked / disabled')..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Summary card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Refund Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Product</span>
                      <span className="font-medium text-gray-800">{refundOrder.product?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Logs ordered</span>
                      <span className="font-medium">{refundOrder.quantity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Faulty logs reported</span>
                      <span className="font-semibold text-red-600">{faultyCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount paid</span>
                      <span>₦{Number(refundOrder.totalPrice).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 mt-1">
                      <span className="font-semibold text-gray-700">Estimated refund</span>
                      <span className="font-bold text-green-600 text-base">
                        ₦{((faultyCount / refundOrder.quantity) * Number(refundOrder.totalPrice)).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      * Final amount is determined by admin after reviewing your proof.
                    </p>
                  </div>
                </div>
              )}

            </div>{/* end scrollable body */}

            {/* Footer navigation */}
            <div className="p-6 border-t border-gray-200 flex justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  if (refundStep === 1) closeRefundModal();
                  else setRefundStep((prev) => (prev - 1) as 1 | 2 | 3);
                }}
                disabled={isRefundSubmitting}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {refundStep === 1 ? "Cancel" : "← Back"}
              </button>

              {refundStep < 3 ? (
                <button
                  onClick={() => {
                    if (refundStep === 2) {
                      const hasEmpty = faultyItems.some((item) => !item.logContent.trim());
                      if (hasEmpty) {
                        toast.error("Please paste the log content for every faulty log.");
                        return;
                      }
                    }
                    setRefundStep((prev) => (prev + 1) as 1 | 2 | 3);
                  }}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleRefundSubmit}
                  disabled={isRefundSubmitting || !refundReason.trim()}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isRefundSubmitting ? "Submitting..." : "Submit Refund Request"}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
