"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ────────────────────────────────────────────────────────────
//  Static knowledge base
// ────────────────────────────────────────────────────────────

interface QuickReply {
  label: string;
  value: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { label: "📅 How to Book",        value: "How do I book a cylinder?" },
  { label: "📦 Booking Status",     value: "How do I check my booking status?" },
  { label: "✅ Eligibility",        value: "When am I eligible to book again?" },
  { label: "🏪 Find Distributor",   value: "How do I find my nearest distributor?" },
  { label: "🚨 Emergency Booking",  value: "I need an emergency cylinder booking." },
  { label: "💬 File a Complaint",   value: "I want to file a complaint." },
];

interface StaticReply {
  keywords: string[];
  answer: string;
}

const KNOWLEDGE_BASE: StaticReply[] = [
  {
    keywords: ["hello", "hi", "hey", "namaste", "good morning", "good evening"],
    answer:
      "👋 Namaste! I'm the GasSafe Assistant. I can help you with cylinder bookings, checking your status, eligibility, finding distributors, and handling complaints.\n\nWhat can I help you with today?",
  },
  {
    keywords: ["book", "cylinder", "how to book", "booking", "reserve", "order"],
    answer:
      "📅 **Booking a Cylinder**\n\n1. Go to **Book Cylinder** in the sidebar\n2. Select your nearest distributor from the dropdown\n3. Choose your urgency type (Medical / BPL / Regular)\n4. Your priority score is calculated automatically\n5. Click **Submit Booking**\n\nYou'll be added to the fair priority queue and receive a queue position number. Deliveries happen in priority order!",
  },
  {
    keywords: ["status", "track", "where", "my booking", "delivery", "when will", "delivered"],
    answer:
      "📦 **Checking Your Booking Status**\n\nYou can view all your bookings under **My Bookings** in the sidebar. Each booking shows:\n- 📅 Request date\n- 🏪 Your distributor\n- 🔢 Queue position\n- ✅ Status (Pending / Delivered)\n\nIf a booking is Pending for more than 5 days, please file a complaint.",
  },
  {
    keywords: ["eligible", "eligibility", "when can i", "30 days", "cooldown", "next booking", "lock"],
    answer:
      "✅ **Booking Eligibility**\n\nGasSafe uses a **30-day fair distribution cycle** to prevent over-booking.\n\n- After each booking, there's a 30-day cooldown\n- Your eligibility countdown is shown on the **Dashboard**\n- BPL households may be eligible for priority exceptions during a crisis\n- Medical urgency can bypass the cooldown in emergencies declared by admin",
  },
  {
    keywords: ["distributor", "nearest", "find", "address", "location", "near me", "pincode"],
    answer:
      "🏪 **Finding Your Distributor**\n\nYou can see all distributors on the **interactive map** on your Dashboard! The map shows:\n\n- 🟢 Green pins = High stock\n- 🟡 Yellow pins = Medium stock\n- 🔴 Red pins = Low stock\n\nChoose a distributor with sufficient stock when booking. The distributor closest to your registered address is recommended.",
  },
  {
    keywords: ["emergency", "medical", "urgent", "critical", "hospital", "sick", "patient"],
    answer:
      "🚨 **Emergency Cylinder Booking**\n\nFor medical emergencies:\n\n1. Go to **Book Cylinder**\n2. Set Urgency to **Medical** — this gives the highest priority score\n3. Submit the booking\n\nAdditionally, if the admin has declared **Emergency Mode**, medical households are automatically moved to the top of the queue.\n\nFor life-threatening situations, call the GasSafe helpline: **1800-XXX-XXXX** (toll-free).",
  },
  {
    keywords: ["complaint", "issue", "problem", "complain", "delay", "wrong", "dispute", "not delivered"],
    answer:
      "💬 **Filing a Complaint**\n\nWe're sorry for the inconvenience! Here's how to escalate:\n\n1. **Delayed delivery**: If pending > 5 days, your booking is automatically flagged\n2. **Wrong delivery**: Contact your distributor directly using the address on the Dashboard map\n3. **Fraud / suspicious activity**: This is handled by our Admin team — suspicious patterns are automatically detected\n\nFor formal complaints, call: **1800-XXX-1234**\nOr email: **support@gassafe.in**",
  },
  {
    keywords: ["price", "cost", "rate", "subsidy", "how much", "fee", "charge"],
    answer:
      "💰 **Cylinder Pricing**\n\nCylinder prices are set by the government and vary by state:\n\n- **Regular (14.2kg)**: ₹850 – ₹950 (market rate)\n- **BPL Subsidised**: ₹450 – ₹500 (with Aadhaar-linked subsidy)\n- **Medical (5kg)**: ₹450 – ₹500\n\n⚠️ Prices may change monthly based on government notification. GasSafe does not control pricing — we only manage the fair distribution queue.",
  },
  {
    keywords: ["bpl", "below poverty", "subsidy", "ration card", "below the poverty"],
    answer:
      "🏠 **BPL Household Benefits**\n\nIf you're registered as a BPL household:\n\n- **+25 priority points** added to your score automatically\n- Eligible for subsidised cylinder pricing\n- Higher chance of priority delivery in crisis situations\n\nMake sure your Aadhaar is linked to your ration card for subsidy benefits. Contact your distributor or local DM office to update BPL status.",
  },
  {
    keywords: ["priority", "score", "queue", "points", "rank", "position"],
    answer:
      "🔢 **How Priority Scores Work**\n\nGasSafe uses a transparent, fair scoring algorithm:\n\n| Factor | Points |\n|---|---|\n| Days since last booking | Up to 40 pts |\n| BPL household | +25 pts |\n| Medical urgency | +35 pts |\n| BPL urgency | +24 pts |\n| Regular urgency | +12 pts |\n\n**Max score = 100**. Higher scores = lower queue number = faster delivery. Your score is shown on every booking page!",
  },
  {
    keywords: ["cancel", "cancellation", "withdraw", "undo", "remove booking"],
    answer:
      "❌ **Cancelling a Booking**\n\nCurrently, bookings in the **Pending** state can be cancelled by contacting your distributor directly.\n\n- Cancelled bookings do **not** reset your 30-day cooldown\n- If the distributor has already processed your booking, cancellation may not be possible\n\nFor help with cancellations, call: **1800-XXX-1234**",
  },
  {
    keywords: ["aadhaar", "kyc", "verify", "id", "document", "proof"],
    answer:
      "📄 **Aadhaar / KYC Requirements**\n\nGasSafe uses Aadhaar-masked IDs to verify households. This means:\n\n- Your full Aadhaar is never stored\n- Only the last 4 digits are displayed for verification\n- Linking Aadhaar ensures subsidy benefits reach the right household\n\nFor KYC updates, visit your nearest distributor with your Aadhaar card.",
  },
  {
    keywords: ["crisis", "shortage", "alert", "emergency mode", "war", "disaster"],
    answer:
      "⚠️ **Crisis & Shortage Mode**\n\nDuring declared crises, the Admin activates **Emergency Mode**:\n\n- Medical and BPL households are **automatically prioritised**\n- Distributors are redirected to shortage-affected zones\n- Booking cooldowns may be relaxed for affected areas\n\nYou'll see a **crisis banner** on your dashboard when emergency mode is active.",
  },
];

function getBotResponse(input: string): string {
  const lower = input.toLowerCase().trim();

  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }

  return "🤖 I'm not sure about that specific question. Here are some things I can help with:\n\n• Booking a cylinder\n• Checking delivery status\n• Eligibility and cooldowns\n• Finding your distributor\n• Emergency bookings\n• Complaints and issues\n• Pricing and subsidies\n\nTry rephrasing your question, or choose one of the quick options below!";
}

// ────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ────────────────────────────────────────────────────────────
//  Component
// ────────────────────────────────────────────────────────────

export function CustomerChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "👋 Namaste! I'm your **GasSafe Assistant**.\n\nI can help you with bookings, delivery status, eligibility, complaints, and more. How can I assist you today?",
      time: formatTime(new Date()),
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: trimmed,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate bot "thinking" delay
    setTimeout(() => {
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: "bot",
        text: getBotResponse(trimmed),
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Render markdown-lite: bold, newlines, bullet points
  const renderText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      const rendered = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j} className="font-semibold text-teal-300">{part}</strong> : part
      );
      return (
        <span key={i}>
          {rendered}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Pulse ring when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-teal-500 opacity-30 animate-ping" />
        )}
        <button
          id="chatbot-toggle-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close chat" : "Open GasSafe Assistant"}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
            open
              ? "bg-slate-700 hover:bg-slate-600 rotate-0"
              : "bg-teal-500 hover:bg-teal-400 hover:scale-110"
          )}
        >
          {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
        </button>
      </div>

      {/* ── Chat panel ── */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-50 flex w-[360px] max-w-[calc(100vw-1.5rem)] flex-col rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300 origin-bottom-right",
          open
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ height: "520px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 rounded-t-2xl border-b border-slate-700/60 bg-gradient-to-r from-teal-600/20 to-slate-900 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20">
            <Sparkles size={18} className="text-teal-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-100">GasSafe Assistant</p>
            <p className="text-xs text-teal-400">● Online — here to help</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs",
                  msg.role === "bot"
                    ? "bg-teal-500/20 text-teal-400"
                    : "bg-slate-700 text-slate-300"
                )}
              >
                {msg.role === "bot" ? <Bot size={14} /> : <User size={14} />}
              </div>

              {/* Bubble */}
              <div className={cn("max-w-[82%]", msg.role === "user" ? "items-end" : "items-start")}>
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    msg.role === "bot"
                      ? "rounded-tl-sm bg-slate-800 text-slate-200"
                      : "rounded-tr-sm bg-teal-600/80 text-white"
                  )}
                >
                  {renderText(msg.text)}
                </div>
                <p className={cn("mt-1 text-[10px] text-slate-600", msg.role === "user" ? "text-right" : "")}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex gap-2">
              <div className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400">
                <Bot size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-slate-800 px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-teal-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <div className="border-t border-slate-700/60 px-3 py-2">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Quick Questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.value}
                onClick={() => sendMessage(qr.value)}
                className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 transition-all duration-150 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-300"
              >
                {qr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-3">
          <input
            ref={inputRef}
            id="chatbot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            disabled={typing}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/30 disabled:opacity-50"
          />
          <button
            id="chatbot-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md transition-all duration-150 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
