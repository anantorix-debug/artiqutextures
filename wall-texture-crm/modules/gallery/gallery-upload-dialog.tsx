"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCreateGalleryImage } from "@/hooks/use-gallery";
import type { GalleryCategory } from "@/types/entities";
import { GalleryType } from "@/types/enums";

const schema = z
  .object({
    title: z.string().min(1, "Required"),
    type: z.enum([GalleryType.PORTFOLIO, GalleryType.DESIGN]),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    subtitle: z.string().optional(),
    tags: z.string().optional(),
    isFeatured: z.boolean(),
  })
  .refine((v) => v.type !== GalleryType.DESIGN || !!v.categoryId, {
    message: "Select a category",
    path: ["categoryId"],
  });
type Values = z.infer<typeof schema>;

export function GalleryUploadDialog({
  categories,
  defaultType = GalleryType.PORTFOLIO,
  trigger,
}: {
  categories: GalleryCategory[];
  defaultType?: GalleryType;
  trigger?: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const createImage = useCreateGalleryImage();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      type: defaultType,
      categoryId: "",
      description: "",
      subtitle: "",
      tags: "",
      isFeatured: false,
    },
  });

  function onSubmit(values: Values) {
    if (!imageFile) return;
    const payload = { ...values, categoryId: values.type === GalleryType.DESIGN ? values.categoryId : undefined };
    createImage.mutate(
      { payload, image: imageFile },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset({ ...form.getValues(), title: "", categoryId: "", description: "", subtitle: "", tags: "", isFeatured: false });
          setImageFile(null);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ?? (
            <Button>
              <Upload className="h-4 w-4" /> Upload Image
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {defaultType === GalleryType.DESIGN ? "Upload Design" : "Upload Portfolio Photo"}
          </DialogTitle>
          <DialogDescription>
            {defaultType === GalleryType.DESIGN
              ? "Add a new catalog entry (finish, material, texture) to the Designs gallery"
              : "Add a completed project photo to the Portfolio gallery"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Image File</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {defaultType === GalleryType.DESIGN && (
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Roman clay, 4 rooms · 2025" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Comma-separated, e.g. Teak, White Oak, Ash" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <FormLabel className="!mt-0">Featured Image</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!imageFile || createImage.isPending}>
                {createImage.isPending ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
