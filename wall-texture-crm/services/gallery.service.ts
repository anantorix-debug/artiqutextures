import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { GalleryCategory, GalleryImage } from "@/types/entities";
import type { GalleryStatus, GalleryType } from "@/types/enums";

export interface GalleryQuery extends PaginationQuery {
  categoryId?: string;
  type?: GalleryType;
  status?: GalleryStatus;
  isFeatured?: "true";
  tag?: string;
  completedOnly?: "true";
}

export interface GalleryFormValues {
  title: string;
  type?: GalleryType;
  /** Required for DESIGN entries; omitted for PORTFOLIO — a project isn't a catalog item. */
  categoryId?: string;
  description?: string;
  subtitle?: string;
  tags?: string;
  isFeatured?: boolean;
  sortOrder?: number;
  status?: GalleryStatus;
}

export const galleryService = {
  async listCategories() {
    const res = await apiClient.get<ApiSuccessResponse<GalleryCategory[]>>("/gallery/categories");
    return res.data.data;
  },
  async createCategory(payload: { name: string; description?: string; sortOrder?: number }) {
    const res = await apiClient.post<ApiSuccessResponse<GalleryCategory>>("/gallery/categories", payload);
    return res.data.data;
  },
  async updateCategory(id: string, payload: { name?: string; description?: string; isActive?: boolean }) {
    const res = await apiClient.patch<ApiSuccessResponse<GalleryCategory>>(`/gallery/categories/${id}`, payload);
    return res.data.data;
  },
  async removeCategory(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/gallery/categories/${id}`);
    return res.data.data;
  },

  async list(query: GalleryQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<GalleryImage[]>>("/gallery", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },
  async get(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<GalleryImage>>(`/gallery/${id}`);
    return res.data.data;
  },
  async create(payload: GalleryFormValues, image: File, thumbnail?: File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    formData.append("image", image);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    const res = await apiClient.post<ApiSuccessResponse<GalleryImage>>("/gallery", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async update(id: string, payload: Partial<GalleryFormValues>, image?: File, thumbnail?: File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (image) formData.append("image", image);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    const res = await apiClient.patch<ApiSuccessResponse<GalleryImage>>(`/gallery/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/gallery/${id}`);
    return res.data.data;
  },
};
