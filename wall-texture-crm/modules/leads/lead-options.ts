import { LeadPriority, LeadSource, LeadStatus } from "@/types/enums";
import { formatStatusLabel } from "@/lib/format";

export const LEAD_STATUS_OPTIONS = Object.values(LeadStatus).map((v) => ({
  value: v,
  label: formatStatusLabel(v),
}));

export const LEAD_PRIORITY_OPTIONS = Object.values(LeadPriority).map((v) => ({
  value: v,
  label: formatStatusLabel(v),
}));

export const LEAD_SOURCE_OPTIONS = Object.values(LeadSource).map((v) => ({
  value: v,
  label: formatStatusLabel(v),
}));
