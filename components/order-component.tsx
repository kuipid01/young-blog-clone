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
  Check,
  AlertTriangle,
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

  // Bank Details State
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [savedBanks, setSavedBanks] = useState<any[]>([]);
  const [selectedSavedBankId, setSelectedSavedBankId] = useState<string>("new");
  const [refundBankName, setRefundBankName] = useState("");
  const [refundBankCode, setRefundBankCode] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");

  const [saveBankDetails, setSaveBankDetails] = useState(false);



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
    setIsRefundModalOpen(true);
    // Close detail view if open
    setSelectedOrder(null);

    // Reset bank details
    setRefundBankName("");
    setRefundBankCode("");
    setRefundAccountNumber("");
    setRefundAccountName("");
    setSelectedSavedBankId("new");
    setSaveBankDetails(false);

    // Fetch banks and saved banks
    fetchBanks();
    fetchSavedBanks();
  };

  const fetchBanks = async () => {
    try {
      const res = await fetch("/api/paystack/banks");
      const data = await res.json();
      if (data.status) {
        setBanks(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch banks", error);
    }
  };

  const fetchSavedBanks = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/user/saved-banks/${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedBanks(data);
      }
    } catch (error) {
      console.error("Failed to fetch saved banks", error);
    }
  };

  // Removed automatic account resolution


  const handleSavedBankChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSavedBankId(val);
    if (val === "new") {
      setRefundBankName("");
      setRefundBankCode("");
      setRefundAccountNumber("");
      setRefundAccountName("");
    } else {
      const bank = savedBanks.find((b) => b.id === val);
      if (bank) {
        setRefundBankName(bank.bankName);
        setRefundBankCode(bank.bankCode || ""); // Assumes saved bank has code, likely need to store it
        setRefundAccountNumber(bank.accountNumber);
        setRefundAccountName(bank.accountName);
      }
    }
  };


  const closeRefundModal = () => {
    setIsRefundModalOpen(false);
    setRefundOrder(null);
  };

  const handleRefundSubmit = async () => {
    if (!refundOrder || !refundReason) {
      toast.error("Please provide a reason for the refund.");
      return;
    }

    if (!refundAccountNumber || !refundAccountName || !refundBankName) {
      toast.error("Please provide valid bank details.");
      return;
    }

    if (!refundAccountName) {
      toast.error("Please provide account name.");
      return;
    }

    setIsRefundSubmitting(true);
    try {
      let proofUrl = "";
      if (refundProofFile) {
        proofUrl = await uploadToCloudinary(refundProofFile);
      }

      const res = await fetch("/api/orders/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          orderId: refundOrder.id,
          reason: refundReason,
          proof: proofUrl,
          bankName: refundBankName,
          bankCode: refundBankCode,
          accountNumber: refundAccountNumber,
          accountName: refundAccountName,
          saveBankDetails
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Refund request failed.");
      }

      toast.success("Refund request submitted successfully.");

      // Update local state
      if (orders) {
        setOrders(orders.map(o => o.id === refundOrder.id ? { ...o, status: "refund_pending" } : o));
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
    selectedOrder?.log?.logDetails || selectedOrder?.data.join("") || "";
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

      {/* Refund Request Modal */}
      {isRefundModalOpen && refundOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[60] flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Request Refund
              </h3>
              <button
                onClick={closeRefundModal}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Requesting refund for Order <span className="font-semibold">#{refundOrder.id}</span>
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Refund <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please explain why you want a refund..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proof (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setRefundProofFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {refundProofFile ? refundProofFile.name : "Click to upload proof"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Bank Details Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  Refund Destination
                </h4>

                {/* Saved Banks Dropdown */}
                {savedBanks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Saved Banks
                    </label>
                    <select
                      value={selectedSavedBankId}
                      onChange={handleSavedBankChange}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                    >
                      <option value="new">-- Enter New Bank Details --</option>
                      {savedBanks.map(bank => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bankName} - {bank.accountNumber} ({bank.accountName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={refundBankCode} // We verify based on code
                      onChange={(e) => {
                        const code = e.target.value;
                        const name = banks.find(b => b.code === code)?.name || "";
                        setRefundBankCode(code);
                        setRefundBankName(name);
                      }}
                      disabled={selectedSavedBankId !== "new"}
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white disabled:bg-gray-100"
                    >
                      <option value="">Select Bank</option>
                      {banks.map(bank => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={refundAccountNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setRefundAccountNumber(val);
                      }}
                      disabled={selectedSavedBankId !== "new"}
                      placeholder="0000000000"
                      className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Account Name Input (Manual) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={refundAccountName}
                    onChange={(e) => setRefundAccountName(e.target.value)}
                    disabled={selectedSavedBankId !== "new"}
                    placeholder="Enter Account Name"
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:bg-gray-100"
                  />
                </div>

                {/* Warning / Note */}
                <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Please ensure the account details entered above are correct. We will not be responsible for funds sent to the wrong account.</p>
                </div>

                {/* Save Checkbox */}
                {selectedSavedBankId === "new" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveBank"
                      checked={saveBankDetails}
                      onChange={(e) => setSaveBankDetails(e.target.checked)}
                      className="w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                    />
                    <label htmlFor="saveBank" className="text-sm text-gray-700 select-none cursor-pointer">
                      Save these bank details for future refunds
                    </label>
                  </div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeRefundModal}
                disabled={isRefundSubmitting}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundSubmit}
                disabled={isRefundSubmitting || !refundReason.trim()}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRefundSubmitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
