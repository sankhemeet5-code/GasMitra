"use client";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { suspiciousAlerts } from "@/data/mock-data";
import { useAppStore } from "@/hooks/use-app-store";
import { CrisisLevel } from "@/types";

const levels: CrisisLevel[] = ["normal", "alert", "emergency"];

export default function AdminPage() {
  const crisisLevel = useAppStore((s) => s.crisisLevel);
  const setCrisisLevel = useAppStore((s) => s.setCrisisLevel);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">Admin Panel</h1>
      <Card>
        <CardHeader>
          <CardTitle>Crisis Level Control</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <Button
              key={level}
              variant={level === crisisLevel ? "default" : "secondary"}
              onClick={() => setCrisisLevel(level)}
            >
              {level}
            </Button>
          ))}
        </CardContent>
      </Card>

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

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total bookings today", "138"],
          ["Cylinders distributed", "104"],
          ["Flagged accounts", "11"],
          ["Shortage areas", "Aurangabad, Mumbai"],
        ].map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">{title}</CardTitle>
            </CardHeader>
            <CardContent className="font-semibold text-teal-300">{value}</CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
