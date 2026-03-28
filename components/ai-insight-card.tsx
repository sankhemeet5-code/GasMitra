"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AIInsightCard({
  title,
  output,
}: {
  title: string;
  output: string;
}) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setText(output);
      setLoading(false);
    }, 1200);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={generate} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate with AI
        </Button>
        {text && <p className="mt-3 text-sm text-slate-300">{text}</p>}
      </CardContent>
    </Card>
  );
}
