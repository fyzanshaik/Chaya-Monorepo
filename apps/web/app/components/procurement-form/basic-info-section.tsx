"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useProcurementFormStore } from "@/app/stores/procurement-form";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Label } from "@workspace/ui/components/label";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Combobox } from "@workspace/ui/components/combobox";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

// Define the schema for the basic info section
const basicInfoSchema = z.object({
  farmerId: z.number({
    required_error: "Farmer is required",
  }),
  crop: z.string().min(1, "Crop is required"),
  procuredForm: z.string().min(1, "Procured form is required"),
  speciality: z.string().min(1, "Speciality is required"),
  quantity: z
    .number({
      required_error: "Quantity is required",
      invalid_type_error: "Quantity must be a number",
    })
    .positive("Quantity must be a positive number"),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface Farmer {
  id: number;
  name: string;
  village: string;
  mandal: string;
}

export function BasicInfoSection() {
  const { form, setForm, initialData } = useProcurementFormStore();
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoadingFarmers, setIsLoadingFarmers] = useState(false);

  // Initialize the form
  const methods = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      farmerId: initialData?.farmerId || 0,
      crop: initialData?.crop || "",
      procuredForm: initialData?.procuredForm || "",
      speciality: initialData?.speciality || "",
      quantity: initialData?.quantity || 0,
    },
  });

  const {
    register,
    control,
    formState: { errors },
  } = methods;

  // Set the form in the store
  useEffect(() => {
    setForm(methods);
  }, [methods, setForm]);

  // Fetch farmers for the dropdown
  useEffect(() => {
    const fetchFarmers = async () => {
      setIsLoadingFarmers(true);
      try {
        const response = await axios.get("http://localhost:5000/api/farmers", {
          withCredentials: true,
        });
        setFarmers(response.data.farmers);
      } catch (error) {
        console.error("Error fetching farmers:", error);
        toast.error("Failed to load farmers");
      } finally {
        setIsLoadingFarmers(false);
      }
    };

    fetchFarmers();
  }, []);

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="farmerId">Farmer</Label>
              <Controller
                control={control}
                name="farmerId"
                render={({ field }) => (
                  <Combobox
                    items={farmers.map(farmer => ({
                      label: `${farmer.name} (${farmer.village}, ${farmer.mandal})`,
                      value: farmer.id.toString(),
                    }))}
                    value={field.value ? field.value.toString() : ""}
                    onChange={val => field.onChange(parseInt(val))}
                    placeholder="Select a farmer"
                    isLoading={isLoadingFarmers}
                  />
                )}
              />
              {errors.farmerId && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.farmerId.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="crop">Crop</Label>
              <Controller
                control={control}
                name="crop"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rice">Rice</SelectItem>
                      <SelectItem value="Wheat">Wheat</SelectItem>
                      <SelectItem value="Maize">Maize</SelectItem>
                      <SelectItem value="Soybean">Soybean</SelectItem>
                      <SelectItem value="Cotton">Cotton</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.crop && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.crop.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="procuredForm">Procured Form</Label>
              <Controller
                control={control}
                name="procuredForm"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw">Raw</SelectItem>
                      <SelectItem value="Processed">Processed</SelectItem>
                      <SelectItem value="Semi-processed">
                        Semi-processed
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.procuredForm && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.procuredForm.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="speciality">Speciality</Label>
              <Controller
                control={control}
                name="speciality"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speciality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Organic">Organic</SelectItem>
                      <SelectItem value="Non-GMO">Non-GMO</SelectItem>
                      <SelectItem value="Fair Trade">Fair Trade</SelectItem>
                      <SelectItem value="Standard">Standard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.speciality && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.speciality.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Controller
                control={control}
                name="quantity"
                render={({ field }) => (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    onChange={e =>
                      field.onChange(Number.parseFloat(e.target.value))
                    }
                  />
                )}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.quantity.message}
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
