import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, PenTool, PlayCircle, Scissors, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Stage = "Pattern" | "Cutting" | "Sewing";
type StageStatus = "pending" | "in-progress" | "completed";

interface StageData {
  id: string;
  name: Stage;
  icon: React.ElementType;
  status: StageStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
}

const STAFF = [
  { id: "s1", name: "Alex M." },
  { id: "s2", name: "Jordan K." },
  { id: "s3", name: "Priya R." },
  { id: "s4", name: "Noah T." },
];

const INITIAL_STAGES: StageData[] = [
  {
    id: "1",
    name: "Pattern",
    icon: PenTool,
    status: "completed",
    assignedStaffId: "s1",
    assignedStaffName: "Alex M.",
  },
  {
    id: "2",
    name: "Cutting",
    icon: Scissors,
    status: "in-progress",
    assignedStaffId: "s2",
    assignedStaffName: "Jordan K.",
  },
  {
    id: "3",
    name: "Sewing",
    icon: Users,
    status: "pending",
  },
];

const statusMeta: Record<StageStatus, { label: string; badgeClass: string }> = {
  completed: {
    label: "Completed",
    badgeClass: "border-emerald-500/45 bg-emerald-500/10 text-emerald-700",
  },
  "in-progress": {
    label: "In Progress",
    badgeClass: "border-sky-500/45 bg-sky-500/10 text-sky-700",
  },
  pending: {
    label: "Pending",
    badgeClass: "border-amber-500/45 bg-amber-500/10 text-amber-700",
  },
};

export const StaffStageAssignmentPage = () => {
  const [stages, setStages] = useState<StageData[]>(INITIAL_STAGES);

  const completion = useMemo(() => {
    const done = stages.filter((stage) => stage.status === "completed").length;
    return Math.round((done / stages.length) * 100);
  }, [stages]);

  const assignStaff = (stageId: string, staffId: string) => {
    const staff = STAFF.find((entry) => entry.id === staffId);
    if (!staff) {
      return;
    }

    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              assignedStaffId: staff.id,
              assignedStaffName: staff.name,
            }
          : stage,
      ),
    );
  };

  const startStage = (stageId: string) => {
    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId && stage.assignedStaffId
          ? {
              ...stage,
              status: "in-progress",
            }
          : stage,
      ),
    );
  };

  const completeStage = (stageId: string) => {
    setStages((current) =>
      current.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              status: "completed",
            }
          : stage,
      ),
    );
  };

  const inProgress = stages.filter((stage) => stage.status === "in-progress").length;
  const pending = stages.filter((stage) => stage.status === "pending").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Manufacturing Workflow</h1>
          <p className="text-muted-foreground text-sm">
            Assign staff to each stage and close tasks with validated ownership.
          </p>
        </div>
        <Button variant="outline" className="w-fit">
          <UserPlus className="size-4" />
          Staff Registry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel border-white/60">
          <CardHeader className="pb-2">
            <CardDescription>Order Completion</CardDescription>
            <CardTitle className="text-3xl">{completion}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={completion} className="h-2 bg-white/55" />
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60">
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{inProgress}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Active stage(s) currently running.
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60">
          <CardHeader className="pb-2">
            <CardDescription>Pending Assignment</CardDescription>
            <CardTitle className="text-3xl">{pending}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Stage(s) waiting for staff assignment.
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-white/60">
        <CardHeader>
          <CardTitle className="text-xl">Order #INV-2026 Stage Control</CardTitle>
          <CardDescription>
            Progress each stage with explicit staff attribution and status transitions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {stages.map((stage) => {
            const meta = statusMeta[stage.status];
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className="rounded-2xl border border-white/60 bg-white/55 p-4 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-white/60 bg-white/65 p-2">
                        <Icon className="text-primary size-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold">{stage.name}</h3>
                        <p className="text-muted-foreground text-xs">
                          {stage.assignedStaffName
                            ? `Assigned to ${stage.assignedStaffName}`
                            : "No staff assigned yet"}
                        </p>
                      </div>
                    </div>

                    <Badge variant="outline" className={meta.badgeClass}>
                      {meta.label}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {stage.status === "pending" && (
                      <>
                        <Select
                          value={stage.assignedStaffId}
                          onValueChange={(value) => assignStaff(stage.id, value)}
                        >
                          <SelectTrigger className="w-full min-w-44 bg-white/60 sm:w-44">
                            <SelectValue placeholder="Select staff" />
                          </SelectTrigger>
                          <SelectContent className="border-white/60 bg-white/90 backdrop-blur-xl">
                            {STAFF.map((staff) => (
                              <SelectItem key={staff.id} value={staff.id}>
                                {staff.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={() => startStage(stage.id)}
                          disabled={!stage.assignedStaffId}
                          className="sm:w-auto"
                        >
                          <PlayCircle className="size-4" />
                          Start Stage
                        </Button>
                      </>
                    )}

                    {stage.status === "in-progress" && (
                      <Button onClick={() => completeStage(stage.id)}>
                        <CheckCircle2 className="size-4" />
                        Complete Stage
                      </Button>
                    )}

                    {stage.status === "completed" && (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        Done
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm backdrop-blur-xl">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Clock3 className="size-4" />
              Workflow updates are reflected instantly in the order timeline.
            </span>
            <Badge variant="outline" className="glass-pill border-white/70 bg-white/70">
              Live Sync
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
