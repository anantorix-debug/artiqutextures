"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { galleryService, type GalleryFormValues, type GalleryQuery } from "@/services/gallery.service";
import { getErrorMessage } from "@/lib/api-client";

export function useGalleryCategories() {
  return useQuery({ queryKey: ["gallery-categories"], queryFn: galleryService.listCategories });
}

export function useCreateGalleryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; description?: string; sortOrder?: number }) =>
      galleryService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast.success("Category created");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateGalleryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; description?: string; isActive?: boolean } }) =>
      galleryService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast.success("Category updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteGalleryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => galleryService.removeCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      toast.success("Category deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useGalleryImages(query: GalleryQuery) {
  return useQuery({
    queryKey: ["gallery", query],
    queryFn: () => galleryService.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useCreateGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, image, thumbnail }: { payload: GalleryFormValues; image: File; thumbnail?: File }) =>
      galleryService.create(payload, image, thumbnail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      queryClient.invalidateQueries({ queryKey: ["gallery-categories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Image uploaded to gallery");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GalleryFormValues> }) =>
      galleryService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => galleryService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Image deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
