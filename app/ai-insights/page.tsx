"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { AIInsightCard } from "@/components/ai-insight-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const mockReplies = [
  "Demand will increase in Aurangabad due to low stock levels.",
  "Re-route one truck from Pune to Mumbai to reduce waiting time by 18%.",
  "Flag rapid repeated bookings from 97XXXX1021 for manual verification.",
];

export default function AIInsightsPage() {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const reply = mockReplies[messages.length % mockReplies.length];
    setMessages((prev) => [
      ...prev,
      { role: "user", text: input },
      { role: "ai",   text: reply },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <RoleGuard>
      <AppShell>
        <h1 className="mb-4 text-2xl font-bold">AI Insights</h1>

        <div className="grid gap-4 lg:grid-cols-3">
          <AIInsightCard
            title="Demand Forecast"
            output="Forecast: next 48h demand +22% in Aurangabad and +15% in Mumbai due to low reserve stock."
          />
          <AIInsightCard
            title="Anomaly Report"
            output="Anomaly: same masked phone linked to 3 bookings in 7 days, likely duplicate household attempts."
          />
          <AIInsightCard
            title="Delivery Suggestions"
            output="Suggestion: prioritize route Aurangabad → Nashik with emergency lane for medical urgency households."
          />
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Ask GasSafe AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              id="ai-chat-window"
              className="mb-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3"
            >
              {messages.length === 0 && (
                <p className="text-sm text-slate-400">
                  Ask about demand forecasts, shortages, or fair allocation...
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "ml-auto bg-teal-600/20 text-teal-200"
                      : "bg-slate-800 text-slate-100"
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="ai-chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask GasSafe AI..."
              />
              <Button id="ai-send-btn" onClick={sendMessage}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    </RoleGuard>
  );
}
