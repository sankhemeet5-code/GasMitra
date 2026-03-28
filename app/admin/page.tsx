"use client";

import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { suspiciousAlerts } from "@/data/mock-data";
import { useAppStore } from "@/hooks/use-app-store";
import { CrisisLevel } from "@/types";

const levels: CrisisLevel[] = ["normal", "alert", "emergency"];

const STAT_CARDS = [
  { label: "Total bookings today",   value: "138" },
  { label: "Cylinders distributed",  value: "104" },
  { label: "Flagged accounts",       value: "11"  },
  { label: "Shortage areas",         value: "Aurangabad, Mumbai" },
];

export default function AdminPage() {
  const crisisLevel    = useAppStore((s) => s.crisisLevel);
  const setCrisisLevel = useAppStore((s) => s.setCrisisLevel);

  const isEmergency = crisisLevel === "emergency";

  return (
    <RoleGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-bold">Admin Panel</h1>

        {/* Emergency warning banner */}
        {isEmergency && (
          <div
            id="emergency-banner"
            className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300"
          >
            <span className="text-xl">🚨</span>
            <div>
              <p className="font-semibold">Emergency Mode Active</p>
              <p className="text-sm text-red-400">
                All resources are being prioritised for medical and BPL households.
                Override standard queue logic with caution.
              </p>
            </div>
          </div>
        )}

        {/* Crisis level control */}
        <Card>
          <CardHeader>
            <CardTitle>Crisis Level Control</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {levels.map((level) => (
              <Button
                key={level}
                id={`crisis-btn-${level}`}
                variant={level === crisisLevel ? "default" : "secondary"}
                onClick={() => setCrisisLevel(level)}
                className={
                  level === "emergency" && crisisLevel === "emergency"
                    ? "bg-red-600 hover:bg-red-500 text-white"
                    : ""
                }
              >
                {level === "emergency" && "🚨 "}{level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Suspicious alerts */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Suspicious Accounts Alerts</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Alert</TH>
                  <TH>Severity</TH>
                </TR>
              </THead>
              <TBody>
                {suspiciousAlerts.map((alert) => (
                  <TR key={alert.id}>
                    <TD>{alert.message}</TD>
                    <TD>
                      <Badge variant={alert.severity === "high" ? "danger" : "warning"}>
                        {alert.severity}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Stat cards with hover animation */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STAT_CARDS.map(({ label, value }) => (
            <Card
              key={label}
              className="transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-900/50"
            >
              <CardHeader>
                <CardTitle className="text-sm text-slate-400">{label}</CardTitle>
              </CardHeader>
              <CardContent className="font-semibold text-teal-300">{value}</CardContent>
            </Card>
          ))}
        </div>
      </AppShell>
    </RoleGuard>
  );
}
