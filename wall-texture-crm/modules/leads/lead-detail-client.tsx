"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  FileText,
  HardHat,
  Pencil,
  Trash2,
  Plus,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LeadFormDialog } from "./lead-form-dialog";
import { LeadTimeline } from "./lead-timeline";
import { useCustomerProfile, useDeleteCustomer } from "@/hooks/use-customers";
import { formatCurrency, formatDate, formatDateTime, formatStatusLabel } from "@/lib/format";

export function LeadDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading } = useCustomerProfile(id);
  const deleteCustomer = useDeleteCustomer();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const { customer, activities, quotations, projects, whatsappMessages } = data;

  return (
    <div>
      <Link href="/leads" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Leads
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{customer.customerName}</h1>
            <StatusBadge status={customer.status} />
            <StatusBadge status={customer.priority} />
          </div>
          {customer.companyName && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {customer.companyName}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => router.push(`/quotations/new?customerId=${customer.id}`)}>
            <Plus className="h-4 w-4" /> New Quotation
          </Button>
          <LeadFormDialog
            mode="edit"
            customer={customer}
            trigger={
              <Button variant="outline">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            }
          />
          <Button variant="outline" className="text-destructive" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="timeline">
            <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            <TabsList className="w-max">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="quotations">Quotations ({quotations.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp ({whatsappMessages.length})</TabsTrigger>
            </TabsList>
            </div>

            <TabsContent value="timeline" className="mt-4">
              <LeadTimeline customerId={customer.id} activities={activities} />
            </TabsContent>

            <TabsContent value="quotations" className="mt-4">
              <Card className="shadow-sm">
                <CardContent>
                  {quotations.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No quotations yet</p>
                  ) : (
                    <ul className="divide-y">
                      {quotations.map((q) => (
                        <li key={q.id} className="flex items-center justify-between py-3">
                          <Link href={`/quotations/${q.id}`} className="flex items-center gap-3 hover:underline">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{q.quotationNumber}</p>
                              <p className="text-xs text-muted-foreground">{q.projectName}</p>
                            </div>
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">{formatCurrency(q.grandTotal)}</span>
                            <StatusBadge status={q.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="mt-4">
              <Card className="shadow-sm">
                <CardContent>
                  {projects.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No projects yet</p>
                  ) : (
                    <ul className="divide-y">
                      {projects.map((p) => (
                        <li key={p.id} className="flex items-center justify-between py-3">
                          <Link href={`/tracking/${p.id}`} className="flex items-center gap-3 hover:underline">
                            <HardHat className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{p.projectName}</p>
                              <p className="text-xs text-muted-foreground">{p.progressPercentage}% complete</p>
                            </div>
                          </Link>
                          <StatusBadge status={p.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="mt-4">
              <Card className="shadow-sm">
                <CardContent>
                  {whatsappMessages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No WhatsApp messages yet</p>
                  ) : (
                    <ul className="divide-y">
                      {whatsappMessages.map((m) => (
                        <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate text-sm">{m.content || m.fileName || formatStatusLabel(m.type)}</p>
                              <p className="text-xs text-muted-foreground">
                                {m.direction === "OUTBOUND" ? "Sent" : "Received"} · {formatDateTime(m.createdAt)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={m.status} />
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">Contact Details</p>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </p>
                {customer.whatsapp && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> {customer.whatsapp}
                  </p>
                )}
                {customer.email && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {customer.email}
                  </p>
                )}
                {(customer.address || customer.city) && (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {[customer.address, customer.city, customer.state, customer.pinCode].filter(Boolean).join(", ")}
                    </span>
                  </p>
                )}
                {customer.gstNumber && <p className="text-muted-foreground">GSTIN: {customer.gstNumber}</p>}
              </div>
            </CardContent>
          </Card>

          {customer.requirement && (
            <Card className="shadow-sm">
              <CardContent>
                <p className="text-sm font-medium">Requirement</p>
                <p className="mt-2 text-sm text-muted-foreground">{customer.requirement}</p>
              </CardContent>
            </Card>
          )}

          {customer.remarks && (
            <Card className="shadow-sm">
              <CardContent>
                <p className="text-sm font-medium">Remarks</p>
                <p className="mt-2 text-sm text-muted-foreground">{customer.remarks}</p>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lead Source</span>
                <span>{formatStatusLabel(customer.leadSource)}</span>
              </div>
              {customer.referredBy && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referred By</span>
                  <span>{customer.referredBy}</span>
                </div>
              )}
              {customer.siteVisitDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Site Visit</span>
                  <span>{formatDate(customer.siteVisitDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(customer.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this lead?"
        description="This will remove the lead and its timeline. This action can be reversed by an administrator via the database if needed."
        destructive
        confirmLabel="Delete"
        loading={deleteCustomer.isPending}
        onConfirm={() =>
          deleteCustomer.mutate(customer.id, {
            onSuccess: () => router.push("/leads"),
          })
        }
      />
    </div>
  );
}
