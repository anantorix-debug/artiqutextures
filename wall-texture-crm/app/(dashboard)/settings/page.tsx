"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanySettings } from "@/modules/settings/company-settings";
import { SettingsForm } from "@/modules/settings/settings-form";
import { AuditLogPanel } from "@/modules/settings/audit-log-panel";
import { BackupPanel } from "@/modules/settings/backup-panel";
import { ChangePasswordForm } from "@/modules/settings/change-password-form";
import { SettingCategory } from "@/types/enums";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" description="Company profile & logo, quotation defaults, WhatsApp, security, audit logs and backups" />

      <Tabs defaultValue="company">
        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="backup">Database Backup</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="company" className="mt-4 max-w-4xl">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <SettingsForm
            category={SettingCategory.WHATSAPP}
            fields={[
              { key: "autoReconnect", label: "Auto Reconnect", type: "boolean", defaultValue: true },
              { key: "notifyOnDisconnect", label: "Notify on Disconnect", type: "boolean", defaultValue: true },
            ]}
          />
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <ChangePasswordForm />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditLogPanel />
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <BackupPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
