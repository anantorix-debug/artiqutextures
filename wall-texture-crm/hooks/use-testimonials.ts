"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  testimonialService,
  type TestimonialFormValues,
  type TestimonialQuery,
} from "@/services/testimonial.service";
import { getErrorMessage } from "@/lib/api-client";

export function useTestimonials(query: TestimonialQuery) {
  return useQuery({
    queryKey: ["testimonials", query],
    queryFn: () => testimonialService.list(query),
    placeholderData: (prev) => prev,
  });
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, avatar }: { payload: TestimonialFormValues; avatar?: File }) =>
      testimonialService.create(payload, avatar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial added");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload, avatar }: { id: string; payload: Partial<TestimonialFormValues>; avatar?: File }) =>
      testimonialService.update(id, payload, avatar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial updated");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => testimonialService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      toast.success("Testimonial deleted");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
