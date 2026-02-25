// app/fund-wallet/ManualDepositContent.tsx (Client Component)
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Banknote, CheckCircle, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { uploadToCloudinary } from "../app/utils/upload-to-cloundinary";
import { jwtDecode } from "jwt-decode";

const IconWithText: React.FC<{
  icon: React.ReactNode;
  text: string;
  className?: string;
}> = ({ icon, text, className }) => (
  <div className={`flex items-center gap-2 text-sm font-medium ${className}`}>
    {icon}
    {text}
  </div>
);

export function ManualDepositContent() {
  const router = useRouter();
  // 💡 Get search parameters safely using the Next.js Client Hook
  const searchParams = useSearchParams();

  // Get the 'amount' from the URL. Fallback to '0' if not present.
  const requestedAmount = searchParams.get("amount") || "0";

  // --- Component State and Constants ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Format the amount for display (e.g., '2000' -> '2,000.00 NGN')
  const requiredAmountDisplay = `${Number(requestedAmount).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )} NGN`;

  const accountNumber = "9122041519";
  const accountName = "DANJUMA JOHN";
  const bankName = "Moniepoint";
  const supportedFormats = "jpg, jpeg, png, pdf, doc, txt, xls, xlsx";
  const automaticPaymentLink = "https://t.me/Youngblogmarketplace/4";

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };
  // Assumptions:
  // - jwtDecode, toast, router, requestedAmount, requiredAmountDisplay, selectedFile,
  //   setIsSubmitting, uploadToCloudinary are available in scope.

  const paymentType = "bank_transfer"; // Define this as a constant outside the handler, within the component body.

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Always call this first

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication expired. Please log in.");
      router.push("/auth/login");
      return;
    }

    if (!selectedFile) {
      toast.error("Please choose a receipt file to upload.");
      return;
    }

    // --- Authentication and Token Decode ---
    let userId: string;
    try {
      const decoded: { id: string; exp?: number } = jwtDecode(token);

      // Check token expiration immediately
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        toast.error("Session expired. Please log in again.");
        router.push("/auth/login");
        return;
      }

      userId = decoded.id;
    } catch (authError) {
      // Handle malformed token or decoding failure
      console.error("Token decoding failed:", authError);
      localStorage.removeItem("token");
      toast.error("Invalid session data. Please log in.");
      router.push("/auth/login");
      return;
    }
    // --- End Authentication ---

    setIsSubmitting(true);
    let uploadToastId: string | number = "upload";

    try {
      // STEP 1: UPLOAD TO CLOUDINARY
      uploadToastId = toast.loading("Uploading receipt proof...", {
        id: uploadToastId,
      });

      const proofUrl = await uploadToCloudinary(selectedFile);

      toast.success("Receipt uploaded successfully!", { id: uploadToastId });

      // STEP 2: SEND DATA AND URL TO NEXT.JS ROUTE HANDLER
      const paymentData = {
        userId: userId,
        amount: requestedAmount,
        paymentType: paymentType,
        proof: proofUrl,
      };

      const confirmationToastId = toast.loading("Confirming payment...", {
        id: "confirmation",
      });

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Update the confirmation toast to an error state
        toast.error(result.message || "Payment confirmation failed.", {
          id: confirmationToastId,
        });
        return;
      }

      // Final success toast
      toast.success(
        `Payment of ${requiredAmountDisplay} confirmed! Your funds will be credited shortly.`,
        { id: confirmationToastId }
      );

      router.push("/dashboard");
    } catch (error) {
      // This catch block handles errors from Cloudinary upload or the fetch call itself.

      // Ensure the loading toast is dismissed/updated if the error occurred during upload
      if (uploadToastId) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected network or upload error occurred.",
          { id: uploadToastId }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!requestedAmount || requestedAmount === "0") {
      router.push(`/dashboard/fund-wallet`);
    }
    console.log(requestedAmount, "requestedamount");
  }, [requestedAmount]);

  return (
    <div className="flex flex-col items-center p-4 lg:p-8 min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg border border-gray-100 p-6 space-y-8">
        {/* 1. Instruction Header Block (Using requestedAmountDisplay) */}
        <div className="text-center space-y-1">
          <p className="text-gray-600 text-sm">
            You have requested{" "}
            <span className="font-bold text-lg text-gray-800">
              {requiredAmountDisplay}
            </span>
            . Please pay {requiredAmountDisplay} for successful payment
          </p>
          <h2 className="text-xl font-semibold text-gray-900 pt-2">
            Please follow the instruction below
          </h2>
        </div>

        {/* 2. Account Details and Warnings (Unchanged) */}
        <div className="border border-gray-200 rounded-xl p-6 space-y-4">
          {/* ... (rest of the account details and warnings) ... */}
          <p className="text-sm text-gray-700">
            You can now make manual deposit direct to our account and your funds
            will be added in less than 10 minutes.
          </p>

          <div className="space-y-1 text-center font-mono">
            <p className="text-2xl font-extrabold text-violet-700 tracking-wider">
              {accountNumber}
            </p>
            <p className="text-base text-gray-800">
              Acc Name: <span className="font-semibold">{accountName}</span>
            </p>
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
              Bank <Banknote className="w-4 h-4 text-green-600" /> :{" "}
              <span className="font-semibold">{bankName}</span>
            </p>
          </div>

          <div className="py-2 space-y-2">
            {/* <IconWithText
              icon={<XCircle className="w-5 h-5 text-red-500" />}
              text="DO NOT send to moniepoint bank"
              className="justify-center text-red-600"
            /> */}
            <IconWithText
              icon={<CheckCircle className="w-5 h-5 text-green-500" />}
              text="PLEASE UPLOAD A CLEAR RECEIPT THAT SHOWS YOUR NAME!"
              className="justify-center text-green-600"
            />
            <p className="text-center text-red-700 text-xs font-semibold pt-1">
              DO NOT UPLOAD PAYyMENT 2 TIMES else your account will be BAN &
              DEACTIVATED.
            </p>
          </div>

          {/* <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              For automatic payments click watch how to fund:
              <a
                href={automaticPaymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700 underline ml-1"
              >
                {automaticPaymentLink}
              </a>
            </p>
          </div> */}
        </div>

        {/* 3. Receipt Upload Section (Unchanged) */}
        <form
          onSubmit={handleSubmit}
          className="p-6 border border-gray-200 rounded-xl bg-gray-50 shadow-inner space-y-4"
        >
          {/* ... (rest of the form) ... */}
          <h3 className="text-lg font-semibold text-gray-800">Receipt</h3>

          <div className="flex items-center space-x-4">
            <label className="flex-grow bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:bg-gray-100 transition duration-150">
              <input
                type="file"
                accept={supportedFormats
                  .split(", ")
                  .map((f) => `.${f}`)
                  .join(", ")}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex justify-between items-center py-3 px-4">
                <span className="text-gray-500">
                  {selectedFile ? selectedFile.name : "Choose file"}
                </span>
                <span className="bg-gray-200 text-gray-700 text-sm font-medium py-1 px-3 rounded-md">
                  {selectedFile ? "Change" : "Browse"}
                </span>
              </div>
            </label>
          </div>

          <p className="text-xs text-gray-500">
            Supported formats:{" "}
            <span className="font-mono">{supportedFormats}</span>
          </p>

          <button
            type="submit"
            disabled={!selectedFile || isSubmitting}
            className="w-full  py-3 mt-4 flex items-center justify-center gap-2 text-white rounded-xl font-semibold transition-colors bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300"
          >
            <Upload className="w-5 h-5" />
            PAY NOW
          </button>
        </form>
      </div>
    </div>
  );
}
