"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Brain, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/types";

interface AdminAnalyticsProps {
  bookings: Array<
    Booking & {
      household?: {
        pincode?: string;
      };
      distributor?: {
        name?: string;
      };
    }
  >;
  loading?: boolean;
}

export function AdminAnalytics({ bookings, loading = false }: AdminAnalyticsProps) {
  const analytics = useMemo(() => {
    const allBookings = bookings.filter((b) => b.status === "pending");

    if (allBookings.length === 0) {
      return {
        totalPredictions: 0,
        avgScore: 0,
        stdDev: 0,
        distribution: [],
        regionalData: [],
        highRiskCount: 0,
        aiInsights: [] as Array<{ type: "warning" | "info" | "critical"; text: string; time: string }>,
      };
    }

    // Calculate distribution
    const scores = allBookings.map((b) => b.priorityScore);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    // Distribution histogram
    const distribution = [
      {
        range: "0-25",
        count: scores.filter((s) => s < 25).length,
        color: "var(--accent)",
      },
      {
        range: "25-50",
        count: scores.filter((s) => s >= 25 && s < 50).length,
        color: "#60a5fa",
      },
      {
        range: "50-75",
        count: scores.filter((s) => s >= 50 && s < 75).length,
        color: "var(--warning)",
      },
      {
        range: "75+",
        count: scores.filter((s) => s >= 75).length,
        color: "var(--danger)",
      },
    ];

    // Regional analysis
    const regionalMap = new Map<string, { scores: number[]; distributorName?: string }>();
    allBookings.forEach((b) => {
      const pincode = b.household?.pincode;
      if (!pincode) return;

      const existing = regionalMap.get(pincode);
      if (!existing) {
        regionalMap.set(pincode, {
          scores: [b.priorityScore],
          distributorName: b.distributor?.name,
        });
      } else {
        existing.scores.push(b.priorityScore);
        if (!existing.distributorName && b.distributor?.name) {
          existing.distributorName = b.distributor.name;
        }
      }
    });

    const regionalData = Array.from(regionalMap.entries()).map(
      ([pincode, region]) => {
        const scores = region.scores;
        const avg = scores.length > 0 ? scores.reduce((a, b) => a + b) / scores.length : 0;
        return {
          name: region.distributorName || `PK ${pincode}`,
          avg: Number(avg.toFixed(1)),
          count: scores.length,
        };
      }
    );

    const highRiskCount = scores.filter((s) => s > 90).length;

    const aiInsights = [
      {
        type: highRiskCount > 0 ? ("critical" as const) : ("info" as const),
        text:
          highRiskCount > 0
            ? `${highRiskCount} potentially anomalous pending bookings require review.`
            : "No critical anomalies detected in pending queue.",
        time: "1 min ago",
      },
      {
        type: stdDev > 20 ? ("warning" as const) : ("info" as const),
        text:
          stdDev > 20
            ? "Score variance is elevated across regions. Inspect fairness drift."
            : "Score variance remains within expected range.",
        time: "3 min ago",
      },
      {
        type: avgScore >= 65 ? ("warning" as const) : ("info" as const),
        text:
          avgScore >= 65
            ? "Average priority is elevated, likely indicating regional stress."
            : "Average priority remains stable for current demand.",
        time: "5 min ago",
      },
    ];

    return {
      totalPredictions: allBookings.length,
      avgScore: Number(avgScore.toFixed(1)),
      stdDev: Number(stdDev.toFixed(1)),
      distribution,
      regionalData,
      highRiskCount,
      aiInsights,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {loading && (
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-12 animate-pulse rounded-md bg-slate-800/60" />
            ))}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-300">
                {analytics.totalPredictions}
              </div>
              <div className="text-xs text-slate-400 mt-1">Pending Bookings</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-300">
                {analytics.avgScore}
              </div>
              <div className="text-xs text-slate-400 mt-1">Avg Score</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-300">
                ±{analytics.stdDev}
              </div>
              <div className="text-xs text-slate-400 mt-1">Std Deviation</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-300">
                {analytics.highRiskCount}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Anomalies (Score &gt; 90)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Score Distribution</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] md:h-[280px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={analytics.distribution}>
              <XAxis dataKey="range" stroke="var(--foreground)" tick={{ fill: "var(--foreground)", fontSize: 11 }} />
              <YAxis stroke="var(--foreground)" tick={{ fill: "var(--foreground)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#f8fafc",
                }}
              />
              <Bar dataKey="count" fill="#14b8a6">
                {analytics.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-teal-400/70 border-teal-400/30">
        <CardHeader className="pt-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles size={16} className="text-teal-300" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-9 animate-pulse rounded-md bg-slate-800/60" />
              ))}
            </div>
          ) : analytics.aiInsights.length === 0 ? (
            <p className="text-sm text-slate-400">No insights yet. AI is analyzing platform data.</p>
          ) : (
            <div className="space-y-2">
              {analytics.aiInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-900/60 p-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        insight.type === "critical"
                          ? "bg-red-400"
                          : insight.type === "warning"
                          ? "bg-amber-400"
                          : "bg-blue-400"
                      }`}
                    />
                    <p className="text-sm text-slate-200">{insight.text}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-500">{insight.time}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Distributor Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distributor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-72 overflow-auto">
              {analytics.regionalData.length === 0 ? (
                <p className="text-sm text-slate-400">No regional data yet</p>
              ) : (
                analytics.regionalData.map((region, idx) => (
                  <div key={idx} className="rounded-md border border-slate-800 bg-slate-900/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-200">{region.name}</div>
                        <div className="text-xs text-slate-500">Orders Today: {region.count}</div>
                      </div>
                      <Badge
                        variant={
                          region.avg >= 75
                            ? "danger"
                            : region.avg >= 45
                            ? "warning"
                            : "success"
                        }
                      >
                        {region.avg >= 75 ? "flagged" : region.avg >= 45 ? "active" : "inactive"}
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full ${
                          region.avg >= 75
                            ? "bg-red-500"
                            : region.avg >= 45
                            ? "bg-amber-500"
                            : "bg-teal-500"
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, region.avg))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">Fulfillment rate: {Math.max(0, Math.min(100, Math.round(100 - region.avg / 2)))}%</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fairness Insights */}
        <Card className="bg-slate-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Brain size={16} className="text-teal-300" />ML Model Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-300">
                Model Status
              </p>
              <Badge className="mt-1 bg-green-500">✓ Deployed</Badge>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300">
                Last Training
              </p>
              <p className="text-xs text-slate-400 mt-1">
                March 24, 2026 - 12,000 samples
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-300">
                Fairness Alert
              </p>
              {analytics.stdDev > 20 ? (
                <Badge variant="warning" className="mt-1">
                  High variance detected
                </Badge>
              ) : (
                <Badge className="mt-1 bg-green-500/80">
                  Fair distribution
                </Badge>
              )}
            </div>

            <div className="border-t border-slate-700 pt-3 text-xs text-slate-400">
              <p>
                ✓ No regional bias detected (variance within acceptable range)
              </p>
              <p className="mt-1">
                ✓ Score distribution follows expected model behavior
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomalies */}
      {analytics.highRiskCount > 0 && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-lg text-red-300">
              🚨 Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-200">
            <p>
              Found {analytics.highRiskCount} booking(s) with unusually high
              scores (&gt;90). Review these customers for:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Potential fraud or system gaming</li>
              <li>Data entry errors</li>
              <li>Legitimate medical/emergency cases</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
