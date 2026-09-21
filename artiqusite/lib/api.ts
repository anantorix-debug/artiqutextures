export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

/** Backend serves uploaded files from its own origin (not under /api) — strip the prefix and join. */
export function assetUrl(path: string): string {
  return `${API_URL.replace(/\/api\/?$/, "")}${path}`;
}

export interface PublicGalleryItem {
  id: string;
  title: string;
  type: "PORTFOLIO" | "DESIGN";
  description?: string | null;
  subtitle?: string | null;
  tags: string[];
  imageUrl: string;
  thumbnailUrl?: string | null;
  isFeatured: boolean;
  category?: { id: string; name: string } | null;
}

export interface PublicGalleryCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiSuccessResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
}

/**
 * Reads live Portfolio/Design entries from the CRM's public API so the
 * marketing site reflects whatever the admin panel actually has published,
 * instead of hardcoded content. Cached for 5 minutes (revalidate) so a page
 * load doesn't wait on the backend every time, and fails soft — returning
 * an empty list rather than throwing — so the page still renders (with its
 * static fallback content) if the backend is offline.
 */
export async function getPublicGallery(type: "PORTFOLIO" | "DESIGN", limit = 6): Promise<PublicGalleryItem[]> {
  try {
    const res = await fetch(`${API_URL}/public/gallery?type=${type}&limit=${limit}&status=ACTIVE`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ApiSuccessResponse<PublicGalleryItem[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

/**
 * Paginated variant for the /designs catalog page's infinite scroll — same
 * fail-soft behaviour, but returns pagination meta so the caller knows
 * whether there's another page to load. Safe to call from the browser too
 * (the backend's CORS_ORIGIN already allows this site's origin).
 */
export async function getPublicGalleryPage(
  type: "PORTFOLIO" | "DESIGN",
  page: number,
  limit = 12,
  categoryId?: string,
): Promise<{ items: PublicGalleryItem[]; meta: PaginationMeta | null }> {
  try {
    const categoryParam = categoryId ? `&categoryId=${categoryId}` : "";
    const res = await fetch(
      `${API_URL}/public/gallery?type=${type}&page=${page}&limit=${limit}&status=ACTIVE${categoryParam}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return { items: [], meta: null };
    const json = (await res.json()) as ApiSuccessResponse<PublicGalleryItem[]>;
    return { items: json.data ?? [], meta: json.meta ?? null };
  } catch {
    return { items: [], meta: null };
  }
}

/** Categories with at least one ACTIVE Design entry — used for the /designs filter bar. */
export async function getPublicDesignCategories(): Promise<PublicGalleryCategory[]> {
  try {
    const res = await fetch(`${API_URL}/public/gallery/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = (await res.json()) as ApiSuccessResponse<PublicGalleryCategory[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export interface PublicTestimonial {
  id: string;
  customerName: string;
  role?: string | null;
  quote: string;
  rating?: number | null;
  avatarUrl?: string | null;
  isFeatured: boolean;
}

/** Same reuse/fallback/caching pattern as getPublicGallery — see its docstring. */
export async function getPublicTestimonials(limit = 6): Promise<PublicTestimonial[]> {
  try {
    const res = await fetch(`${API_URL}/public/testimonials?limit=${limit}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as ApiSuccessResponse<PublicTestimonial[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}
