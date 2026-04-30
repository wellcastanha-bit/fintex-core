"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  Wallet,
  Settings,
  CalendarClock,
  BarChart3,
  FileBarChart2,
} from "lucide-react";
import { useState } from "react";

type Item = {
  href: string;
  label: string;
  Icon: any;
};

const ALL_ITEMS: (Item & { holdingHide?: boolean })[] = [
  { href: "/dashboard", label: "Dashboard", Icon: BarChart3 },
  { href: "/pdv", label: "PDV", Icon: LayoutGrid, holdingHide: true },
  { href: "/pedidos", label: "Pedidos", Icon: List },
  { href: "/caixa-diario", label: "Caixa Diário", Icon: Wallet },
  { href: "/reservas", label: "Reservas", Icon: CalendarClock },
  { href: "/configuracoes", label: "Configurações", Icon: Settings, holdingHide: true },
];

export default function Sidebar({ isHolding = false }: { isHolding?: boolean }) {
  const ITEMS = isHolding ? ALL_ITEMS.filter((i) => !i.holdingHide) : ALL_ITEMS;
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const CLOSED_W = 96;
  const OPEN_W = 280;
  const TOPBAR_H = 76;

  return (
    <aside
      style={{
        width: open ? OPEN_W : CLOSED_W,
        height: `calc(100vh - ${TOPBAR_H}px)`,
        background: `
          linear-gradient(
            0deg,
            rgba(1,27,60,0.96) 0%,
            rgba(3,16,40,0.94) 100%
          )
        `,

        borderRight: "none",
        boxShadow: "none",

        transition: "width 180ms ease",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setHoveredHref(null);
      }}
    >
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {ITEMS.map((it) => {
          const active = pathname === it.href;
          const hovered = hoveredHref === it.href;
          const Icon = it.Icon;
          const glowOn = hovered && !active;

          return (
            <Link
              key={it.href}
              href={it.href}
              title={!open ? it.label : undefined}
              onMouseEnter={() => setHoveredHref(it.href)}
              onMouseLeave={() =>
                setHoveredHref((cur) => (cur === it.href ? null : cur))
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                height: 64,
                padding: "0 8px",
                borderRadius: 18,
                textDecoration: "none",
                color: "#fff",
                background: active
                  ? "rgba(0,182,194,0.22)"
                  : "rgba(255,255,255,0.06)",
                border: glowOn
                  ? "1px solid rgba(45,207,190,0.25)"
                  : "1px solid rgba(255,255,255,0.08)",
                boxShadow: active
                  ? "inset 0 0 0 1px rgba(255,255,255,0.10)"
                  : glowOn
                  ? "inset 0 0 0 1px rgba(255,255,255,0.05), 0 8px 18px rgba(0,0,0,0.18)"
                  : "inset 0 0 0 1px rgba(255,255,255,0.05)",
                transition:
                  "border 160ms ease, box-shadow 160ms ease, background 160ms ease",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 52px",
                }}
              >
                <Icon
                  size={28}
                  color={active || hovered ? "#2DCFBE" : "#ffffff"}
                  style={{
                    transition: "color 160ms ease",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  maxWidth: open ? 220 : 0,
                  opacity: open ? 1 : 0,
                  transition: "max-width 180ms ease, opacity 120ms ease",
                }}
              >
                {it.label}
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}