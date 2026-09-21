import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse, PaginationQuery } from "@/types/api";
import type { AuditLog, CompanyProfile, DatabaseBackup } from "@/types/entities";
import type { SettingCategory } from "@/types/enums";

export interface SettingEntry {
  key: string;
  value: string | null;
  isSecret: boolean;
  hasValue: boolean;
}

export interface SettingEntryInput {
  key: string;
  value: string;
  isSecret?: boolean;
}

export const settingsService = {
  async getCompanyProfile() {
    const res = await apiClient.get<ApiSuccessResponse<CompanyProfile>>("/settings/company/profile");
    return res.data.data;
  },
  async updateCompanyProfile(payload: Partial<Omit<CompanyProfile, "logoUrl" | "tftLogoUrl">>) {
    const res = await apiClient.patch<ApiSuccessResponse<CompanyProfile>>("/settings/company/profile", payload);
    return res.data.data;
  },
  async uploadLogo(file: File) {
    const fd = new FormData();
    fd.append("logo", file);
    const res = await apiClient.post<ApiSuccessResponse<CompanyProfile>>("/settings/company/logo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async uploadTftLogo(file: File) {
    const fd = new FormData();
    fd.append("logo", file);
    const res = await apiClient.post<ApiSuccessResponse<CompanyProfile>>("/settings/company/logo-tft", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },
  async removeTftLogo() {
    const res = await apiClient.delete<ApiSuccessResponse<CompanyProfile>>("/settings/company/logo-tft");
    return res.data.data;
  },
  async removeLogo() {
    const res = await apiClient.delete<ApiSuccessResponse<CompanyProfile>>("/settings/company/logo");
    return res.data.data;
  },
  async getByCategory(category: SettingCategory) {
    const res = await apiClient.get<ApiSuccessResponse<SettingEntry[]>>(`/settings/${category}`);
    return res.data.data;
  },
  async upsert(category: SettingCategory, entries: SettingEntryInput[]) {
    const res = await apiClient.post<ApiSuccessResponse<SettingEntry[]>>(`/settings/${category}`, { entries });
    return res.data.data;
  },
  async listAuditLogs(query: PaginationQuery & { module?: string; action?: string } = {}) {
    const res = await apiClient.get<ApiSuccessResponse<AuditLog[]>>("/settings/audit/logs", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },
  async runBackup() {
    const res = await apiClient.post<ApiSuccessResponse<DatabaseBackup>>("/settings/backup/run");
    return res.data.data;
  },
  async listBackups(query: PaginationQuery = {}) {
    const res = await apiClient.get<ApiSuccessResponse<DatabaseBackup[]>>("/settings/backup/history", { params: query });
    return { items: res.data.data, meta: res.data.meta! };
  },
  async downloadBackup(id: string) {
    const res = await apiClient.get(`/settings/backup/${id}/download`, { responseType: "blob" });
    return res.data as Blob;
  },
};
