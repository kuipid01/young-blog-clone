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
} from "lucide-react";
import { toast } from "sonner";
import { useGetLoggedInUserId } from "../app/utils/getloggedinuser";

// Define a type for an Order to improve type safety (optional but good practice)
interface Order {
  id: string;
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
    status: "used"|"unused";
  };
  format: string;
  quantity: number;
  totalPrice: number;
  status: "completed" | "pending" | "failed";
  createdAt: string;
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
  const { userId } = useGetLoggedInUserId();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Order["status"] | "all">(
    "all"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // State for View Details modal

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  console.log(selectedOrder, "selected order");
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
      default:
        return null;
    }
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
                    className="hover:bg-gray-50 transition-colors"
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
                            {order?.product?.name}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
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
                    {selectedOrder?.product?.name}
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

              <div className="bg-gray-100 rounded-md px-2 text-bold py-2">
                <p className="text-sm font-medium text-gray-500">
                  Delivery Format
                </p>
                <code className="text-sm text-gray-700 bg-gray-100 p-2 rounded-md inline-block mt-1">
                 {selectedOrder?.log?.logDetails} 
                </code>
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
