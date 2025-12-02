"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useForm, Controller } from "react-hook-form";
import {
  CustomModal,
  CustomModalBody,
  CustomModalFooter,
  CustomModalHeader,
} from "./custom-modal";

interface ProfileFormValues {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  address: string;
  state: string;
  zip: string;
  city: string;
  country: string;
}

export default function ProfileModal({isOpen,setIsOpen}:{
    setIsOpen:(v:boolean) => void,
    isOpen:boolean
}) {

  const [showError, setShowError] = useState(false);

  const { control, handleSubmit } = useForm<ProfileFormValues>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "kuipid01@gmail.com",
      mobile: "",
      address: "",
      state: "",
      zip: "",
      city: "",
      country: "",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    if (!data.mobile) {
      setShowError(true);
      return;
    }
    setShowError(false);
    console.log("Form Data:", data);
    setIsOpen(false);
  };

  return (
    <>
    
      <CustomModal open={isOpen} onOpenChange={setIsOpen}>
        <CustomModalHeader onClose={() => setIsOpen(false)}>
          Profile
        </CustomModalHeader>

        <CustomModalBody>
          {showError && (
            <Alert variant="destructive">
              You need to enter your phone number to proceed with account
              creation!
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name</Label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            <div>
              <Label>Last Name</Label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

            <div>
              <Label>Email Address</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} disabled />}
              />
            </div>

            <div>
              <Label>Mobile Number</Label>
              <Controller
                name="mobile"
                control={control}
                render={({ field }) => <Input {...field} />}
              />
            </div>

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
          <Button onClick={handleSubmit(onSubmit)} className="w-full">
            Submit
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </>
  );
}
