"use client";

import { useState } from "react";
import { Star, MessageCircle, Trash2, HardHat, Images } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GalleryUploadDialog } from "@/modules/gallery/gallery-upload-dialog";
import { CategoryManagerDialog } from "@/modules/gallery/category-manager-dialog";
import { SendGalleryWhatsAppDialog } from "@/modules/gallery/send-gallery-whatsapp-dialog";
import { GalleryDetailDialog } from "@/modules/gallery/gallery-detail-dialog";
import { cn } from "@/lib/utils";
import { useDeleteGalleryImage, useGalleryCategories, useGalleryImages } from "@/hooks/use-gallery";
import { API_BASE_URL } from "@/lib/api-client";
import type { GalleryCategory, GalleryImage } from "@/types/entities";
import { GalleryType } from "@/types/enums";

const PORTFOLIO_TAGS = ["Residential", "Commercial", "Interior", "Exterior", "Texture", "Wallpaper", "Metallic"];

function fileUrl(path: string) {
  return `${API_BASE_URL.replace(/\/api$/, "")}${path}`;
}

/** Shared grid for a single gallery type — Portfolio has no category concept, Designs does. */
function GalleryGrid({
  type,
  categories,
  showCategoryFilter,
  onDelete,
}: {
  type: GalleryType;
  categories: GalleryCategory[];
  showCategoryFilter: boolean;
  onDelete: (id: string) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [chip, setChip] = useState<string>("ALL");
  const [detail, setDetail] = useState<GalleryImage | null>(null);
  const { data, isLoading } = useGalleryImages({
    page: 1,
    limit: 60,
    type,
    categoryId: showCategoryFilter && categoryId ? categoryId : undefined,
    completedOnly: !showCategoryFilter && chip === "COMPLETED" ? "true" : undefined,
    tag: !showCategoryFilter && chip !== "ALL" && chip !== "COMPLETED" ? chip : undefined,
  });

  return (
    <div>
      {!showCategoryFilter && (
        <div className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {["ALL", "COMPLETED", ...PORTFOLIO_TAGS].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setChip(c)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                chip === c ? "border-foreground bg-foreground text-background" : "hover:bg-muted",
              )}
            >
              {c === "ALL" ? "All" : c === "COMPLETED" ? "Completed Projects" : c}
            </button>
          ))}
        </div>
      )}
      {showCategoryFilter && (
        <div className="mb-4">
          <Select value={categoryId || "ALL"} onValueChange={(v) => setCategoryId(v === "ALL" || !v ? "" : v)}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="All Categories">
                {categoryId ? categories.find((c) => c.id === categoryId)?.name : "All Categories"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            {type === GalleryType.DESIGN
              ? "No designs yet. Upload the first catalog entry to get started."
              : chip !== "ALL"
                ? "Nothing matches this filter yet."
                : "No portfolio entries yet. Upload a photo, or open a completed project and choose “Publish to Gallery”."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((img: GalleryImage) => (
            <div key={img.id} className="group overflow-hidden rounded-xl border bg-card shadow-sm">
              <div className="relative aspect-square cursor-pointer overflow-hidden bg-muted" onClick={() => setDetail(img)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileUrl(img.thumbnailUrl ?? img.imageUrl)}
                  alt={img.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                {img.isFeatured && (
                  <Badge className="absolute left-2 top-2 gap-1 border-0 bg-amber-500/90 text-white">
                    <Star className="h-3 w-3 fill-current" /> Featured
                  </Badge>
                )}
                {img.projectId && (
                  <Badge className={cn("absolute left-2 gap-1 border-0 bg-emerald-600/90 text-white", img.isFeatured ? "top-9" : "top-2")}>
                    <HardHat className="h-3 w-3" /> Project
                  </Badge>
                )}
                {(img.photos?.length ?? 0) > 1 && (
                  <Badge className="absolute right-2 top-2 gap-1 border-0 bg-black/60 text-white">
                    <Images className="h-3 w-3" /> {img.photos!.length}
                  </Badge>
                )}
                <div
                  className="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/50 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SendGalleryWhatsAppDialog
                    galleryId={img.id}
                    trigger={
                      <Button size="icon-sm" variant="secondary" className="h-7 w-7">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(img.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="p-2.5">
                <p className="truncate text-sm font-medium">{img.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {img.subtitle || img.category?.name}
                </p>
                {img.project && (
                  <Link href={`/tracking/${img.project.id}`} className="mt-0.5 block truncate text-[11px] text-muted-foreground underline-offset-2 hover:underline">
                    From project: {img.project.projectName}
                  </Link>
                )}
                {img.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {img.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                        {tag}
                      </Badge>
                    ))}
                    {img.tags.length > 3 && (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-normal">
                        +{img.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <GalleryDetailDialog item={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

export default function GalleryPage() {
  const [tab, setTab] = useState<GalleryType>(GalleryType.PORTFOLIO);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { data: categories } = useGalleryCategories();
  const deleteImage = useDeleteGalleryImage();

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Completed projects and the design catalog — publish a finished project straight from Project Tracking"
        actions={
          <>
            <CategoryManagerDialog />
            <GalleryUploadDialog
              categories={categories ?? []}
              defaultType={tab}
              trigger={
                <Button>
                  {tab === GalleryType.DESIGN ? "Upload Design" : "Upload Portfolio Photo"}
                </Button>
              }
            />
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => v && setTab(v as GalleryType)}>
        <TabsList>
          <TabsTrigger value={GalleryType.PORTFOLIO}>Portfolio</TabsTrigger>
          <TabsTrigger value={GalleryType.DESIGN}>Designs</TabsTrigger>
        </TabsList>

        <TabsContent value={GalleryType.PORTFOLIO} className="mt-4">
          <GalleryGrid
            type={GalleryType.PORTFOLIO}
            categories={categories ?? []}
            showCategoryFilter={false}
            onDelete={setDeleteTarget}
          />
        </TabsContent>

        <TabsContent value={GalleryType.DESIGN} className="mt-4">
          <GalleryGrid
            type={GalleryType.DESIGN}
            categories={categories ?? []}
            showCategoryFilter
            onDelete={setDeleteTarget}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this image?"
        destructive
        confirmLabel="Delete"
        loading={deleteImage.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteImage.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) });
        }}
      />
    </div>
  );
}
