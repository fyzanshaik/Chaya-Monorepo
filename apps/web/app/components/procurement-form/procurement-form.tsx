"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Button } from "@workspace/ui/components/button";
import { BasicInfoSection } from "./basic-info-section";
import { DetailsSection } from "./details-section";
import { ReviewSection } from "./review-section";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@workspace/ui/components/dialog";
import axios from "axios";
import { useProcurementFormStore } from "@/app/stores/procurement-form";
import type { FieldValues } from "react-hook-form";
import { useAuth } from "@/app/providers/auth-provider";
import { toast } from "sonner";

interface ProcurementFormProps {
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  procurementId?: number;
}

export function ProcurementForm({
  mode,
  open,
  onOpenChange,
  procurementId,
}: ProcurementFormProps) {
  const { user } = useAuth();
  const {
    activeTab,
    setActiveTab,
    goToNextTab,
    goToPreviousTab,
    form,
    isSubmitting,
    setIsSubmitting,
  } = useProcurementFormStore();

  const title = mode === "add" ? "Add New Procurement" : "Edit Procurement";

  const handleSubmit = async (data: FieldValues) => {
    setIsSubmitting(true);
    console.log("Submitting procurement data:", JSON.stringify(data, null, 2));

    try {
      const axiosConfig = {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (mode === "add") {
        console.log("Doing a POST request to add a new procurement");
        const response = await axios.post(
          "http://localhost:5000/api/procurements",
          data,
          axiosConfig
        );
        console.log("POST response:", response.data);
        toast.success("Procurement added successfully");
      } else {
        console.log("Doing a PUT request to update procurement", procurementId);
        const response = await axios.put(
          `http://localhost:5000/api/procurements/${procurementId}`,
          data,
          axiosConfig
        );
        console.log("PUT response:", response.data);
        toast.success("Procurement updated successfully");
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      console.error("Error response:", error.response?.data);

      if (error.response?.status === 401) {
        toast.error("Your session has expired. Please log in again.");
      } else {
        toast.error(
          `Error: ${error.response?.data?.error || error.message || "Something went wrong"}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab as any}
          className="mt-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
          <TabsContent value="basic" className="space-y-4">
            <BasicInfoSection />
          </TabsContent>
          <TabsContent value="details" className="space-y-4">
            <DetailsSection />
          </TabsContent>
          <TabsContent value="review" className="space-y-4">
            <ReviewSection />
          </TabsContent>
        </Tabs>
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={goToPreviousTab}
              disabled={activeTab === "basic"}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={goToNextTab}
              disabled={activeTab === "review"}
            >
              Next
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {activeTab === "review" && (
              <Button
                type="button"
                onClick={async () => {
                  console.log("Submit button clicked, form exists:", !!form);
                  if (form) {
                    const values = form.getValues();

                    const isValid = await form.trigger();

                    if (isValid) {
                      handleSubmit(values);
                    } else {
                      setTimeout(() => {
                        const errors = form.formState.errors;
                        console.log(
                          "Validation errors:",
                          JSON.stringify(errors, null, 2)
                        );
                      }, 100);
                    }
                  }
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Procurement"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
