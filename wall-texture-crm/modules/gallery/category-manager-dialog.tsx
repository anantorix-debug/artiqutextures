"use client";

import { useState } from "react";
import { FolderCog, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useCreateGalleryCategory,
  useDeleteGalleryCategory,
  useGalleryCategories,
} from "@/hooks/use-gallery";

export function CategoryManagerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { data: categories } = useGalleryCategories();
  const createCategory = useCreateGalleryCategory();
  const deleteCategory = useDeleteGalleryCategory();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <FolderCog className="h-4 w-4" /> Categories
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gallery Categories</DialogTitle>
          <DialogDescription>Organize gallery images into categories</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                createCategory.mutate({ name }, { onSuccess: () => setName("") });
              }
            }}
          />
          <Button
            disabled={!name.trim() || createCategory.isPending}
            onClick={() => createCategory.mutate({ name }, { onSuccess: () => setName("") })}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {categories?.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted">
              <span className="text-sm">{c.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {c._count?.images ?? 0} images
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => deleteCategory.mutate(c.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
