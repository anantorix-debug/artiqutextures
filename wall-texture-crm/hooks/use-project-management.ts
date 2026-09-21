"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  projectService,
  type ColorInput,
  type ExpenseFilters,
  type ExpenseInput,
  type MaterialInput,
  type PaymentInput,
  type PhotoMeta,
  type PublishInput,
} from "@/services/project.service";
import { getErrorMessage } from "@/lib/api-client";

const key = (id: string, ...rest: unknown[]) => ["project", id, ...rest];

export function useProjectSummary(id: string) {
  return useQuery({ queryKey: key(id, "summary"), queryFn: () => projectService.summary(id) });
}
export function useProjectActivities(id: string) {
  return useQuery({ queryKey: key(id, "activities"), queryFn: () => projectService.activities(id) });
}

/** After any change to a project child record, refresh summary + activity + the list itself. */
function useRefresh(id: string) {
  const qc = useQueryClient();
  return (...lists: string[]) => {
    lists.forEach((l) => qc.invalidateQueries({ queryKey: key(id, l) }));
    qc.invalidateQueries({ queryKey: key(id, "summary") });
    qc.invalidateQueries({ queryKey: key(id, "activities") });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  };
}

const onError = (error: unknown) => toast.error(getErrorMessage(error));

// ------------------------------------------------------------------ expenses
export function useExpenses(id: string, filters: ExpenseFilters) {
  return useQuery({
    queryKey: key(id, "expenses", filters),
    queryFn: () => projectService.listExpenses(id, filters),
    placeholderData: (prev) => prev,
  });
}
export function useExpenseMutations(id: string) {
  const refresh = useRefresh(id);
  const create = useMutation({
    mutationFn: ({ values, receipt }: { values: ExpenseInput; receipt?: File | null }) =>
      projectService.createExpense(id, values, receipt),
    onSuccess: () => {
      refresh("expenses");
      toast.success("Expense added");
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ expenseId, values, receipt }: { expenseId: string; values: Partial<ExpenseInput>; receipt?: File | null }) =>
      projectService.updateExpense(id, expenseId, values, receipt),
    onSuccess: () => {
      refresh("expenses");
      toast.success("Expense updated");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (expenseId: string) => projectService.removeExpense(id, expenseId),
    onSuccess: () => {
      refresh("expenses");
      toast.success("Expense deleted");
    },
    onError,
  });
  return { create, update, remove };
}

// ----------------------------------------------------------------- materials
export function useMaterials(id: string) {
  return useQuery({ queryKey: key(id, "materials"), queryFn: () => projectService.listMaterials(id) });
}
export function useMaterialMutations(id: string) {
  const refresh = useRefresh(id);
  const create = useMutation({
    mutationFn: (values: MaterialInput) => projectService.createMaterial(id, values),
    onSuccess: () => {
      refresh("materials");
      toast.success("Material added");
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ materialId, values }: { materialId: string; values: Partial<MaterialInput> }) =>
      projectService.updateMaterial(id, materialId, values),
    onSuccess: () => {
      refresh("materials");
      toast.success("Material updated");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (materialId: string) => projectService.removeMaterial(id, materialId),
    onSuccess: () => {
      refresh("materials");
      toast.success("Material removed");
    },
    onError,
  });
  const importFromQuotation = useMutation({
    mutationFn: (ids?: string[]) => projectService.importMaterials(id, ids),
    onSuccess: (r) => {
      refresh("materials");
      toast.success(r.created ? `${r.created} material${r.created > 1 ? "s" : ""} imported` : "Everything is already imported");
    },
    onError,
  });
  return { create, update, remove, importFromQuotation };
}

// -------------------------------------------------------------------- colors
export function useColors(id: string) {
  return useQuery({ queryKey: key(id, "colors"), queryFn: () => projectService.listColors(id) });
}
export function useColorMutations(id: string) {
  const refresh = useRefresh(id);
  const create = useMutation({
    mutationFn: ({ values, image }: { values: ColorInput; image?: File | null }) =>
      projectService.createColor(id, values, image),
    onSuccess: () => {
      refresh("colors");
      toast.success("Color added");
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ colorId, values, image }: { colorId: string; values: Partial<ColorInput>; image?: File | null }) =>
      projectService.updateColor(id, colorId, values, image),
    onSuccess: () => {
      refresh("colors");
      toast.success("Color updated");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (colorId: string) => projectService.removeColor(id, colorId),
    onSuccess: () => {
      refresh("colors");
      toast.success("Color removed");
    },
    onError,
  });
  return { create, update, remove };
}

// -------------------------------------------------------------------- photos
export function usePhotos(id: string) {
  return useQuery({ queryKey: key(id, "photos"), queryFn: () => projectService.listPhotos(id) });
}
export function usePhotoMutations(id: string) {
  const refresh = useRefresh(id);
  const upload = useMutation({
    mutationFn: ({ files, meta, onProgress }: { files: File[]; meta: PhotoMeta; onProgress?: (p: number) => void }) =>
      projectService.uploadPhotos(id, files, meta, onProgress),
    onSuccess: (photos) => {
      refresh("photos");
      toast.success(`${photos.length} photo${photos.length > 1 ? "s" : ""} uploaded`);
    },
    onError,
  });
  const update = useMutation({
    mutationFn: ({ photoId, meta }: { photoId: string; meta: PhotoMeta }) => projectService.updatePhoto(id, photoId, meta),
    onSuccess: () => {
      refresh("photos");
      toast.success("Photo updated");
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (photoId: string) => projectService.removePhoto(id, photoId),
    onSuccess: () => {
      refresh("photos");
      toast.success("Photo deleted");
    },
    onError,
  });
  return { upload, update, remove };
}

// ------------------------------------------------------------------ payments
export function useProjectPayments(id: string) {
  return useQuery({ queryKey: key(id, "payments"), queryFn: () => projectService.payments(id) });
}
export function usePaymentMutations(id: string) {
  const refresh = useRefresh(id);
  const qc = useQueryClient();
  const done = (msg: string) => () => {
    refresh("payments");
    qc.invalidateQueries({ queryKey: ["quotations"] });
    toast.success(msg);
  };
  const add = useMutation({
    mutationFn: (values: PaymentInput) => projectService.addPayment(id, values),
    onSuccess: done("Payment recorded"),
    onError,
  });
  const update = useMutation({
    mutationFn: ({ paymentId, values }: { paymentId: string; values: Partial<PaymentInput> }) =>
      projectService.updatePayment(id, paymentId, values),
    onSuccess: done("Payment updated"),
    onError,
  });
  const remove = useMutation({
    mutationFn: (paymentId: string) => projectService.removePayment(id, paymentId),
    onSuccess: done("Payment deleted"),
    onError,
  });
  return { add, update, remove };
}

// ------------------------------------------------------------------- gallery
export function useProjectGalleryEntry(id: string) {
  return useQuery({ queryKey: key(id, "gallery"), queryFn: () => projectService.galleryEntry(id) });
}
export function useGalleryPublish(id: string) {
  const refresh = useRefresh(id);
  const qc = useQueryClient();
  const after = (msg: string) => () => {
    refresh("gallery");
    qc.invalidateQueries({ queryKey: ["gallery"] });
    qc.invalidateQueries({ queryKey: ["tracking"] });
    toast.success(msg);
  };
  const publish = useMutation({
    mutationFn: (values: PublishInput) => projectService.publish(id, values),
    onSuccess: after("Published to gallery"),
    onError,
  });
  const unpublish = useMutation({
    mutationFn: () => projectService.unpublish(id),
    onSuccess: after("Removed from gallery"),
    onError,
  });
  return { publish, unpublish };
}
