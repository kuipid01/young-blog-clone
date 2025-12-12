"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useForm, Controller, UseFormSetValue } from "react-hook-form";
import {
  CustomModal,
  CustomModalBody,
  CustomModalFooter,
  CustomModalHeader,
} from "./custom-modal";
import { useGetLoggedInUser } from "../app/hooks/use-get-logged-in-user";
import { useUserWallet } from "../app/utils/get-wallet"; // Assuming this is correct

// --- START: Define Necessary Interfaces ---

// Assuming useGetLoggedInUser returns the ID needed for the wallet update
interface LoggedInUser {
  id: string; // Crucial: This is the user's ID, which maps to the wallet's userId
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// Assumed shape of the wallet data fetched by useUserWallet
interface UserWallet {
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string; // The schema field is 'zipCode'
  // ... other wallet fields
}

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string; // Maps to schema's phoneNumber
  address: string;
  state: string;
  zip: string; // Maps to schema's zipCode
  city: string;
  country: string;
}

// The payload structure expected by the /api/wallet PUT handler
interface WalletUpdatePayload {
  walletId: string; // userId
  firstName: string;
  lastName: string;
  phoneNumber: string; // from 'mobile'
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string; // from 'zip'
}

// --- END: Define Necessary Interfaces ---

export default function ProfileModal({
  isOpen,
  setIsOpen,
}: {
  setIsOpen: (v: boolean) => void;
  isOpen: boolean;
}) {
  const [showError, setShowError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ensure the ID is destructured for the walletId
  const { user } = useGetLoggedInUser() as { user: LoggedInUser | null };
  const { wallet, refetchWallet: refetch } = useUserWallet(); // Assuming refetch exists

  const { control, handleSubmit, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "default@example.com",
      mobile: "",
      address: "",
      state: "",
      zip: "",
      city: "",
      country: "",
    },
  });

  // --- useEffect: Populate form with user and wallet data ---
  useEffect(() => {
    // Clear status messages when modal opens
    if (isOpen) {
      setShowError(null);
      setSuccessMessage(null);
    }

    // Prioritize wallet data if available, then fallback to user data
    if (user) {
      setValue("email", user.email || "");

      // Map common user fields (often less complete than wallet details)
      if (user.first_name) setValue("firstName", user.first_name);
      if (user.last_name) setValue("lastName", user.last_name);
      if (user.phone) setValue("mobile", user.phone);
    }

    // Overlay/Populate with more specific wallet details
    if (wallet) {
      if (wallet.firstName) setValue("firstName", wallet.firstName);
      if (wallet.lastName) setValue("lastName", wallet.lastName);
      if (wallet.phoneNumber) setValue("mobile", wallet.phoneNumber); // Map phoneNumber to mobile

      if (wallet.address) setValue("address", wallet.address);
      if (wallet.city) setValue("city", wallet.city);
      if (wallet.state) setValue("state", wallet.state);
      if (wallet.country) setValue("country", wallet.country);
      if (wallet.zipCode) setValue("zip", wallet.zipCode); // Map zipCode to zip
    }
  }, [user, wallet, setValue, isOpen]);

  // --- onSubmit: Call the /api/wallet PUT handler ---
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user?.id) {
      setShowError("User ID is missing. Cannot update wallet.");
      return;
    }
    if (!data.mobile) {
      setShowError("You need to enter your phone number to proceed!");
      return;
    }

    setShowError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // Map form data to the required WalletUpdatePayload structure
    const payload: WalletUpdatePayload = {
      walletId: user.id, // The userId is the walletId
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.mobile, // Mapping: mobile -> phoneNumber
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      zipCode: data.zip, // Mapping: zip -> zipCode
    };

    try {
      const response = await fetch("/api/wallet", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update wallet details.");
      }

      const result = await response.json();
      setSuccessMessage(result.message || "Wallet updated successfully!");

      // Refetch the wallet data to ensure the UI immediately reflects the new state
      if (refetch) refetch();

      // Close modal after success
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMessage(null);
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during update.";
      console.error("Wallet Update Error:", errorMessage);
      setShowError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX (Rendering) ---
  return (
    <>
      <CustomModal open={isOpen} onOpenChange={setIsOpen}>
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          Profile
        </CustomModalHeader>

        <CustomModalBody>
          {/* Status Alerts */}
          {showError && <Alert variant="destructive">{showError}</Alert>}
          {successMessage && (
            <Alert className="bg-green-100 border-green-500 text-green-700">
              {successMessage}
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <Label>First Name</Label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>
            {/* Last Name */}
            <div>
              <Label>Last Name</Label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            {/* Email Address - DISABLED */}
            <div>
              <Label>Email Address</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} disabled />}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <Label>Mobile Number</Label>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            {/* Remaining Fields */}
            <div>
              <Label>Address</Label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            <div>
              <Label>State</Label>
              <Controller
                name="state"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            <div>
              <Label>Zip Code</Label>
              <Controller
                name="zip"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            <div>
              <Label>City</Label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            <div className="col-span-2">
              <Label>Country</Label>
              <Controller
                name="country"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>
          </div>
        </CustomModalBody>
        <CustomModalFooter>
          <Button
            onClick={handleSubmit(onSubmit)}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Updating Wallet..." : "Submit"}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </>
  );
}
