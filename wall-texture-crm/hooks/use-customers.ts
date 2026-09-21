"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customerService, type CustomerFormValues, type CustomerQuery } from "@/services/customer.service";
import { getErrorMessage } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download";

export function useCustomers(query: CustomerQuery) {
  return useQuery({
    queryKey: ["customers", query],
    queryFn: () => customerService.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => customerService.get(id as string),
    enabled: !!id,
  });
}

export function useCustomerProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id, "profile"],
    queryFn: () => customerService.getProfile(id as string),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerFormValues) => customerService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Lead created successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CustomerFormValues>) => customerService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Lead updated successfully");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customerService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Lead deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAddActivity(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { type?: string; title: string; description?: string; activityDate?: string }) =>
      customerService.addActivity(customerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", customerId, "profile"] });
      toast.success("Activity added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useExportCustomers() {
  return useMutation({
    mutationFn: async ({ format, query }: { format: "excel" | "pdf"; query: CustomerQuery }) => {
      const blob = format === "excel" ? await customerService.exportExcel(query) : await customerService.exportPdf(query);
      downloadBlob(blob, `leads-export.${format === "excel" ? "xlsx" : "pdf"}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
