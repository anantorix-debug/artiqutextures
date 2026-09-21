import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { Testimonial } from "@/types/entities";
import type { GalleryStatus } from "@/types/enums";

export interface TestimonialQuery extends PaginationQuery {
  status?: GalleryStatus;
  isFeatured?: "true";
}

export interface TestimonialFormValues {
  customerName: string;
  role?: string;
  quote: string;
  rating?: number;
  isFeatured?: boolean;
  sortOrder?: number;
  status?: GalleryStatus;
}

export const testimonialService = {
  async list(query: TestimonialQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<Testimonial[]>>("/testimonials", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },
  async get(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Testimonial>>(`/testimonials/${id}`);
    return res.data.data;
  },
  async create(payload: TestimonialFormValues, avatar?: File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (avatar) formData.append("avatar", avatar);
    const res = await apiClient.post<ApiSuccessResponse<Testimonial>>("/testimonials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async update(id: string, payload: Partial<TestimonialFormValues>, avatar?: File) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    if (avatar) formData.append("avatar", avatar);
    const res = await apiClient.patch<ApiSuccessResponse<Testimonial>>(`/testimonials/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ message: string }>>(`/testimonials/${id}`);
    return res.data.data;
  },
};
