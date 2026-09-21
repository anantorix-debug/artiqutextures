import type { Metadata } from "next";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { DesignCatalog } from "@/components/designs/design-catalog";
import { getPublicDesignCategories, getPublicGalleryPage } from "@/lib/api";

export const metadata: Metadata = {
  title: "All designs",
  description: "Every texture coat, wood slat and finish Artiqu Surface makes — browse the full catalog by category.",
};

export default async function DesignsPage() {
  const [{ items, meta }, categories] = await Promise.all([
    getPublicGalleryPage("DESIGN", 1, 12),
    getPublicDesignCategories(),
  ]);

  return (
    <>
      <Nav />
      <main className="flex-1 bg-paper px-6 py-20 sm:px-10 lg:px-24">
        <div className="mx-auto max-w-[1248px]">
          <p className="text-eyebrow text-ink/55">FULL CATALOG</p>
          <span className="mt-4 block h-[2px] w-[34px] bg-brass" />
          <h1 className="text-head-1 mt-6 text-ink">Every design we make.</h1>
          <p className="text-lead mt-5 max-w-[520px] text-ink-soft/85">
            Texture coats and wood slat panels, organized by category. Tap any card to read the full description and
            ask about it.
          </p>

          <div className="mt-14">
            <DesignCatalog initialItems={items} initialMeta={meta} categories={categories} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
