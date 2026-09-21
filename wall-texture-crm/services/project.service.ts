import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  GalleryImage,
  PaymentSummary,
  ProjectActivity,
  ProjectColor,
  ProjectExpense,
  ProjectMaterial,
  ProjectPhoto,
  ProjectSummary,
} from "@/types/entities";
import type { ExpenseCategory, PaymentMethod, PhotoStage } from "@/types/enums";

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

/** Builds FormData, skipping undefined; empty strings are kept so a field can be cleared. */
function toFormData(values: Record<string, unknown>, files: Record<string, File | File[] | null | undefined> = {}) {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, String(v));
  });
  Object.entries(files).forEach(([k, f]) => {
    if (!f) return;
    (Array.isArray(f) ? f : [f]).forEach((file) => fd.append(k, file));
  });
  return fd;
}

export interface ExpenseInput {
  expenseDate?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy?: string;
  vendor?: string;
  paymentMethod?: PaymentMethod | "";
  notes?: string;
  removeReceipt?: boolean;
}

export interface ExpenseFilters {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  search?: string;
}

export interface MaterialInput {
  name: string;
  brand?: string;
  quantity: number;
  unit?: string;
  rate?: number;
  description?: string;
  notes?: string;
  quotationItemId?: string;
}

export interface ColorInput {
  name: string;
  hexCode: string;
  brand?: string;
  shadeNumber?: string;
  finish?: string;
  usedIn?: string;
  notes?: string;
  removeReferenceImage?: boolean;
}

export interface PhotoMeta {
  stage?: PhotoStage;
  caption?: string;
  description?: string;
  takenAt?: string;
  materialId?: string;
  colorId?: string;
}

export interface PaymentInput {
  paymentDate?: string;
  amount: number;
  method?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface PublishInput {
  photoIds: string[];
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string;
  isFeatured?: boolean;
  status?: "ACTIVE" | "INACTIVE";
}

const base = (id: string) => `/tracking/${id}`;

export const projectService = {
  async summary(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<ProjectSummary>>(`${base(id)}/summary`);
    return res.data.data;
  },
  async activities(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<ProjectActivity[]>>(`${base(id)}/activities`);
    return res.data.data;
  },

  // expenses
  async listExpenses(id: string, filters: ExpenseFilters = {}) {
    const res = await apiClient.get<ApiSuccessResponse<{ items: ProjectExpense[]; total: number; count: number }>>(
      `${base(id)}/expenses`,
      { params: filters },
    );
    return res.data.data;
  },
  async createExpense(id: string, values: ExpenseInput, receipt?: File | null) {
    const res = await apiClient.post<ApiSuccessResponse<ProjectExpense>>(
      `${base(id)}/expenses`,
      toFormData({ ...values }, { receipt }),
      multipart,
    );
    return res.data.data;
  },
  async updateExpense(id: string, expenseId: string, values: Partial<ExpenseInput>, receipt?: File | null) {
    const res = await apiClient.patch<ApiSuccessResponse<ProjectExpense>>(
      `${base(id)}/expenses/${expenseId}`,
      toFormData({ ...values }, { receipt }),
      multipart,
    );
    return res.data.data;
  },
  async removeExpense(id: string, expenseId: string) {
    await apiClient.delete(`${base(id)}/expenses/${expenseId}`);
  },

  // materials
  async listMaterials(id: string) {
    const res = await apiClient.get<
      ApiSuccessResponse<{
        items: ProjectMaterial[];
        quotationItems: Array<{ id: string; srNo: number; productName: string; sqft: string | number; description?: string | null; linked: boolean }>;
      }>
    >(`${base(id)}/materials`);
    return res.data.data;
  },
  async createMaterial(id: string, values: MaterialInput) {
    const res = await apiClient.post<ApiSuccessResponse<ProjectMaterial>>(`${base(id)}/materials`, values);
    return res.data.data;
  },
  async updateMaterial(id: string, materialId: string, values: Partial<MaterialInput>) {
    const res = await apiClient.patch<ApiSuccessResponse<ProjectMaterial>>(`${base(id)}/materials/${materialId}`, values);
    return res.data.data;
  },
  async removeMaterial(id: string, materialId: string) {
    await apiClient.delete(`${base(id)}/materials/${materialId}`);
  },
  async importMaterials(id: string, quotationItemIds?: string[]) {
    const res = await apiClient.post<ApiSuccessResponse<{ created: number }>>(
      `${base(id)}/materials/import-from-quotation`,
      { quotationItemIds },
    );
    return res.data.data;
  },

  // colors
  async listColors(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<ProjectColor[]>>(`${base(id)}/colors`);
    return res.data.data;
  },
  async createColor(id: string, values: ColorInput, referenceImage?: File | null) {
    const res = await apiClient.post<ApiSuccessResponse<ProjectColor>>(
      `${base(id)}/colors`,
      toFormData({ ...values }, { referenceImage }),
      multipart,
    );
    return res.data.data;
  },
  async updateColor(id: string, colorId: string, values: Partial<ColorInput>, referenceImage?: File | null) {
    const res = await apiClient.patch<ApiSuccessResponse<ProjectColor>>(
      `${base(id)}/colors/${colorId}`,
      toFormData({ ...values }, { referenceImage }),
      multipart,
    );
    return res.data.data;
  },
  async removeColor(id: string, colorId: string) {
    await apiClient.delete(`${base(id)}/colors/${colorId}`);
  },

  // photos
  async listPhotos(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<ProjectPhoto[]>>(`${base(id)}/photos`);
    return res.data.data;
  },
  async uploadPhotos(id: string, files: File[], meta: PhotoMeta, onProgress?: (pct: number) => void) {
    const res = await apiClient.post<ApiSuccessResponse<ProjectPhoto[]>>(
      `${base(id)}/photos`,
      toFormData({ ...meta }, { photos: files }),
      {
        ...multipart,
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    return res.data.data;
  },
  async updatePhoto(id: string, photoId: string, meta: PhotoMeta) {
    const res = await apiClient.patch<ApiSuccessResponse<ProjectPhoto>>(`${base(id)}/photos/${photoId}`, meta);
    return res.data.data;
  },
  async removePhoto(id: string, photoId: string) {
    await apiClient.delete(`${base(id)}/photos/${photoId}`);
  },

  // payments
  async payments(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<PaymentSummary>>(`${base(id)}/payments`);
    return res.data.data;
  },
  async addPayment(id: string, values: PaymentInput) {
    const res = await apiClient.post<ApiSuccessResponse<PaymentSummary>>(`${base(id)}/payments`, values);
    return res.data.data;
  },
  async updatePayment(id: string, paymentId: string, values: Partial<PaymentInput>) {
    const res = await apiClient.patch<ApiSuccessResponse<PaymentSummary>>(`${base(id)}/payments/${paymentId}`, values);
    return res.data.data;
  },
  async removePayment(id: string, paymentId: string) {
    const res = await apiClient.delete<ApiSuccessResponse<PaymentSummary>>(`${base(id)}/payments/${paymentId}`);
    return res.data.data;
  },

  // gallery
  async galleryEntry(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<GalleryImage | null>>(`${base(id)}/gallery`);
    return res.data.data;
  },
  async publish(id: string, values: PublishInput) {
    const res = await apiClient.post<ApiSuccessResponse<GalleryImage>>(`${base(id)}/gallery`, values);
    return res.data.data;
  },
  async unpublish(id: string) {
    await apiClient.delete(`${base(id)}/gallery`);
  },
};
