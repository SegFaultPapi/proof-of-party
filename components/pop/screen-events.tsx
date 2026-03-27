"use client"

import { Calendar, MapPin, QrCode, ChevronLeft, CheckCircle2, XCircle } from "lucide-react"
import { useApp, MOCK_EVENTS, type Event } from "@/lib/store"
import { cn } from "@/lib/utils"

function EventCard({ event, onSelect }: { event: Event; onSelect: (e: Event) => void }) {
  const isActive = event.status === "active"
  const isClosed = event.status === "closed"
  const isChecked = event.status === "checked"

  return (
    <div
      className={cn(
        "rounded-2xl p-4 flex flex-col gap-3 transition-all card-shadow",
        isActive && "cursor-pointer hover:shadow-md",
        isClosed && "opacity-60"
      )}
      style={{
        background: "#ffffff",
        border: isChecked
          ? "1px solid rgba(131, 110, 249, 0.45)"
          : "1px solid #e8e0ff",
        boxShadow: isChecked ? "0 0 0 3px rgba(131,110,249,0.08)" : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-base leading-snug" style={{ color: "#1a0f3c" }}>{event.name}</h3>
        {isActive && (
          <span
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ color: "#16a34a", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Activo
          </span>
        )}
        {isClosed && (
          <span
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ color: "#7c6bb5", background: "#f0ebff", border: "1px solid #d8ccfa" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#b0a0d8]" />
            Cerrado
          </span>
        )}
        {isChecked && (
          <span
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
            style={{ color: "#836ef9", background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.25)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#836ef9]" />
            Registrado
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#7c6bb5" }}>
          <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#a594fb" }} />
          {event.date}
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#7c6bb5" }}>
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#a594fb" }} />
          {event.venue}
        </div>
      </div>

      {/* CTA */}
      {isActive && (
        <button
          onClick={() => onSelect(event)}
          className="mt-1 w-full font-semibold rounded-xl py-2.5 text-sm transition-all hover:opacity-90 active:scale-95 text-white glow-purple-sm bg-gradient-purple"
        >
          Check-In en este evento
        </button>
      )}
      {isChecked && (
        <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "#836ef9" }}>
          <CheckCircle2 className="w-4 h-4" />
          Check-in confirmado — reporta tu cruda
        </div>
      )}
      {isClosed && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "#b0a0d8" }}>
          <XCircle className="w-4 h-4" />
          Este evento ya cerro
        </div>
      )}
    </div>
  )
}

export function ScreenEvents() {
  const { goTo, selectEvent, checkIn } = useApp()

  const events = MOCK_EVENTS.map(e =>
    checkIn && e.id === checkIn.eventId ? { ...e, status: "checked" as const } : e
  )

  return (
    <main className="min-h-screen pt-20 pb-10 px-5 max-w-md mx-auto" style={{ background: "#f8f5ff" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => goTo("home")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "#ffffff", border: "1px solid #d8ccfa" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#1a0f3c" }} />
        </button>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "#1a0f3c" }}>Eventos</h1>
          <p className="text-xs" style={{ color: "#7c6bb5" }}>Selecciona donde vas esta noche</p>
        </div>
      </div>

      {/* QR scan button */}
      <button
        className="w-full rounded-2xl p-4 flex items-center gap-3 mb-5 transition-all hover:shadow-md active:scale-[0.99] card-shadow"
        style={{ background: "#ffffff", border: "1px dashed #b0a0d8" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.2)" }}
        >
          <QrCode className="w-5 h-5" style={{ color: "#836ef9" }} />
        </div>
        <div className="text-left">
          <p className="font-semibold text-sm" style={{ color: "#1a0f3c" }}>Escanear QR del evento</p>
          <p className="text-xs" style={{ color: "#7c6bb5" }}>Apunta a la entrada del antro</p>
        </div>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: "#e8e0ff" }} />
        <span className="text-xs" style={{ color: "#b0a0d8" }}>o elige manualmente</span>
        <div className="flex-1 h-px" style={{ background: "#e8e0ff" }} />
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-3">
        {events.map(event => (
          <EventCard key={event.id} event={event} onSelect={selectEvent} />
        ))}
      </div>

      {/* Active check-in banner */}
      {checkIn && (
        <div
          className="mt-6 rounded-2xl p-4 card-shadow"
          style={{ background: "#ffffff", border: "1px solid rgba(131,110,249,0.3)" }}
        >
          <p className="text-xs mb-1" style={{ color: "#7c6bb5" }}>Tienes check-in activo en</p>
          <p className="font-bold text-sm mb-3" style={{ color: "#836ef9" }}>{checkIn.eventName}</p>
          <button
            onClick={() => goTo("metrics")}
            className="w-full font-semibold rounded-xl py-2.5 text-sm transition-colors hover:opacity-90 active:scale-95"
            style={{
              background: "rgba(131,110,249,0.08)",
              border: "1px solid rgba(131,110,249,0.25)",
              color: "#836ef9",
            }}
          >
            Reportar mi cruda
          </button>
        </div>
      )}
    </main>
  )
}
