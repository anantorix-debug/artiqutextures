"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsService, type SettingEntryInput } from "@/services/settings.service";
import { getErrorMessage } from "@/lib/api-client";
import { downloadBlob } from "@/lib/download";
import type { PaginationQuery } from "@/types/api";
import type { SettingCategory } from "@/types/enums";

export function useSettings(category: SettingCategory) {
  return useQuery({ queryKey: ["settings", category], queryFn: () => settingsService.getByCategory(category) });
}

export function useUpsertSettings(category: SettingCategory) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: SettingEntryInput[]) => settingsService.upsert(category, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", category] });
      toast.success("Settings saved");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useAuditLogs(query: PaginationQuery) {
  return useQuery({
    queryKey: ["audit-logs", query],
    queryFn: () => settingsService.listAuditLogs(query),
    placeholderData: (prev) => prev,
  });
}

export function useBackups(query: PaginationQuery) {
  return useQuery({
    queryKey: ["backups", query],
    queryFn: () => settingsService.listBackups(query),
    placeholderData: (prev) => prev,
  });
}

export function useRunBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.runBackup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["backups"] });
      toast.success(data.status === "SUCCESS" ? "Backup completed successfully" : "Backup finished with issues");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDownloadBackup() {
  return useMutation({
    mutationFn: async ({ id, fileName }: { id: string; fileName: string }) => {
      const blob = await settingsService.downloadBackup(id);
      downloadBlob(blob, fileName);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCompanyProfile() {
  return useQuery({ queryKey: ["company-profile"], queryFn: settingsService.getCompanyProfile, staleTime: 60_000 });
}

export function useCompanyProfileMutations() {
  const queryClient = useQueryClient();
  const done = (msg: string) => () => {
    queryClient.invalidateQueries({ queryKey: ["company-profile"] });
    toast.success(msg);
  };
  const save = useMutation({
    mutationFn: settingsService.updateCompanyProfile,
    onSuccess: done("Company settings saved"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const uploadLogo = useMutation({
    mutationFn: settingsService.uploadLogo,
    onSuccess: done("Logo updated — it now appears on every quotation"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const removeLogo = useMutation({
    mutationFn: settingsService.removeLogo,
    onSuccess: done("Logo removed"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const uploadTftLogo = useMutation({
    mutationFn: settingsService.uploadTftLogo,
    onSuccess: done("Time For Texture logo updated"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const removeTftLogo = useMutation({
    mutationFn: settingsService.removeTftLogo,
    onSuccess: done("Logo removed"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  return { save, uploadLogo, removeLogo, uploadTftLogo, removeTftLogo };
}
