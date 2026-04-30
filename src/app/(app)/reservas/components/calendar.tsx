"use client";

import React from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function MonthCalendar({
  monthDate,
  selectedISO,
  onSelectISO,
  hasReservaByDay,
}: {
  monthDate: Date;
  selectedISO: string;
  onSelectISO: (iso: string) => void;
  hasReservaByDay: Record<string, boolean>;
}) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const totalDays = new Date(y, m + 1, 0).getDate();

  const days: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(toISODate(new Date(y, m, d)));
  while (days.length % 7 !== 0) days.push(null);

  const week = ["D", "S", "T", "Q", "Q", "S", "S"];

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 10,
          marginBottom: 10,
          color: "#eaf0ff",
          fontWeight: 900,
          fontSize: 12,
          opacity: 0.9,
          userSelect: "none",
        }}
      >
        {week.map((w, i) => (
          <div key={`${w}-${i}`} style={{ textAlign: "center" }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {days.map((iso, i) => {
          if (!iso) return <div key={`e-${i}`} style={{ height: 44 }} />;

          const d = Number(iso.slice(-2));
          const active = iso === selectedISO;
          const hasReserva = !!hasReservaByDay[iso];

          return (
            <div
              key={iso}
              onClick={() => onSelectISO(iso)}
              style={{
                height: 44,
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                border: hasReserva
                  ? "1px solid rgba(45,207,190,0.70)"
                  : active
                  ? "1px solid rgba(45,207,190,0.55)"
                  : "1px solid rgba(255,255,255,0.10)",
                background: hasReserva
                  ? "rgba(45,207,190,0.58)"
                  : active
                  ? "rgba(45,207,190,0.10)"
                  : "rgba(255,255,255,0.04)",
                boxShadow: hasReserva
                  ? "0 0 18px rgba(45,207,190,0.22)"
                  : active
                  ? "0 0 0 1px rgba(45,207,190,0.18)"
                  : "none",
                color: "#ffffff",
                fontWeight: 900,
              }}
            >
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}
