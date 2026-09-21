import {
  LayoutDashboard,
  Users,
  Inbox,
  FileText,
  HardHat,
  Image as ImageIcon,
  Quote,
  MessageCircle,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Enquiries", href: "/enquiries", icon: Inbox },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Quotations", href: "/quotations", icon: FileText },
  { label: "Project Tracking", href: "/tracking", icon: HardHat },
  { label: "Gallery", href: "/gallery", icon: ImageIcon },
  { label: "Testimonials", href: "/testimonials", icon: Quote },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];
