"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateProject } from "@/hooks/use-tracking";
import { toInputDate, formatProjectStatus } from "@/lib/format";
import { ProjectStatus } from "@/types/enums";
import type { ProjectTracking } from "@/types/entities";

/** Existing progress controls, kept intact: status, %, stage, team, dates and remarks. */
export function ProjectUpdateForm({ project }: { project: ProjectTracking }) {
  const updateProject = useUpdateProject(project.id);
  const [status, setStatus] = useState(project.status);
  const [progress, setProgress] = useState(project.progressPercentage);
  const [currentStage, setCurrentStage] = useState(project.currentStage ?? "");
  const [assignedTeam, setAssignedTeam] = useState(project.assignedTeam ?? "");
  const [startDate, setStartDate] = useState(toInputDate(project.startDate));
  const [expectedCompletionDate, setExpectedCompletionDate] = useState(toInputDate(project.expectedCompletionDate));
  const [actualCompletionDate, setActualCompletionDate] = useState(toInputDate(project.actualCompletionDate));
  const [remarks, setRemarks] = useState(project.remarks ?? "");

  function changeStatus(next: ProjectTracking["status"]) {
    setStatus(next);
    // Completing a project means 100% done and (if empty) completed today.
    if (next === "COMPLETED") {
      setProgress(100);
      if (!actualCompletionDate) setActualCompletionDate(toInputDate(new Date().toISOString()));
    }
  }

  function handleSave() {
    updateProject.mutate({
      status,
      progressPercentage: progress,
      currentStage: currentStage || undefined,
      assignedTeam: assignedTeam || undefined,
      startDate: startDate || undefined,
      expectedCompletionDate: expectedCompletionDate || undefined,
      actualCompletionDate: actualCompletionDate || undefined,
      remarks: remarks || undefined,
    });
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Update progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v && changeStatus(v as never)}>
              <SelectTrigger className="w-full"><SelectValue>{formatProjectStatus(status)}</SelectValue></SelectTrigger>
              <SelectContent>
                {Object.values(ProjectStatus).map((s) => (
                  <SelectItem key={s} value={s}>{formatProjectStatus(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Progress ({progress}%)</Label>
            <Input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
            <Progress value={progress} className="h-1.5" />
          </div>
          <div className="space-y-1.5">
            <Label>Current stage</Label>
            <Input placeholder="e.g. Base coat applied" value={currentStage} onChange={(e) => setCurrentStage(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Assigned team</Label>
            <Input placeholder="e.g. Team A - Ramesh, Suresh" value={assignedTeam} onChange={(e) => setAssignedTeam(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Expected completion</Label>
            <Input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Actual completion</Label>
            <Input type="date" value={actualCompletionDate} onChange={(e) => setActualCompletionDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Remarks</Label>
          <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <Button onClick={handleSave} disabled={updateProject.isPending}>
          {updateProject.isPending ? "Saving..." : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
