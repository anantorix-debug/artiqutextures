import { TrackingDetailClient } from "@/modules/tracking/tracking-detail-client";

export default async function TrackingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TrackingDetailClient id={id} />;
}
