"use client"

import { ChevronLeft, Upload, BedDouble, Footprints, Heart, Loader2 } from "lucide-react"
import { useState } from "react"
import { useApp, type Metrics } from "@/lib/store"
import { cn } from "@/lib/utils"

function SleepSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const color =
    value < 5 ? "#dc2626" : value < 7 ? "#d97706" : "#16a34a"

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.22)" }}
          >
            <BedDouble className="w-4 h-4" style={{ color: "#836ef9" }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "#ffffff" }}>Horas de sueno</p>
            <p className="text-xs" style={{ color: "#a594fb" }}>Cuanto dormiste?</p>
          </div>
        </div>
        <span className="text-2xl font-bold tabular-nums" style={{ color }}>
          {value}h
        </span>
      </div>

      <div className="relative">
        <input
          type="range"
          min={0}
          max={12}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, #836ef9 ${(value / 12) * 100}%, #e8e0ff ${(value / 12) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-2 px-0.5">
          {[0, 3, 6, 9, 12].map(h => (
            <span key={h} className="text-[10px] font-mono" style={{ color: "#b0a0d8" }}>{h}h</span>
          ))}
        </div>
      </div>

      {value < 5 && (
        <p className="mt-2 text-xs text-red-500">Menos de 5h = cruda casi asegurada</p>
      )}
    </div>
  )
}

function NumberInput({
  icon: Icon,
  label,
  sublabel,
  value,
  onChange,
  placeholder,
  unit,
  min,
  max,
}: {
  icon: React.ElementType
  label: string
  sublabel: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  unit: string
  min: number
  max: number
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(131,110,249,0.1)", border: "1px solid rgba(131,110,249,0.22)" }}
      >
        <Icon className="w-4 h-4" style={{ color: "#836ef9" }} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm" style={{ color: "#ffffff" }}>{label}</p>
        <p className="text-xs" style={{ color: "#a594fb" }}>{sublabel}</p>
      </div>
      <div
        className="flex items-center gap-1.5 rounded-xl px-3 py-2 w-28"
        style={{ background: "rgba(131, 110, 249, 0.1)", border: "1px solid #d8ccfa" }}
      >
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm font-bold text-right outline-none tabular-nums placeholder:opacity-40"
          style={{ color: "#ffffff" }}
        />
        <span className="text-xs flex-shrink-0" style={{ color: "#a594fb" }}>{unit}</span>
      </div>
    </div>
  )
}

export function ScreenMetrics() {
  const { checkIn, submitMetrics, goTo } = useApp()
  const [sleep, setSleep] = useState(6)
  const [steps, setSteps] = useState("")
  const [bpm, setBpm] = useState("")

  const isValid =
    sleep >= 0 &&
    sleep <= 12 &&
    Number(steps) >= 0 &&
    Number(steps) <= 30000 &&
    Number(bpm) >= 40 &&
    Number(bpm) <= 200

  const handleSubmit = () => {
    if (!isValid) return
    submitMetrics({ sleep, steps: Number(steps), bpm: Number(bpm) })
  }

  return (
    <main className="min-h-screen pt-20 pb-10 px-5 max-w-md mx-auto" style={{ background: "#0a0514" }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => goTo("events")}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-[#e8e0ff]"
          style={{ background: "var(--surface-1)", border: "1px solid #d8ccfa" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "#ffffff" }} />
        </button>
        <div>
          <h1 className="font-bold text-xl text-gradient-purple">
            Como amaneciste?
          </h1>
          <p className="text-xs" style={{ color: "#a594fb" }}>
            {checkIn ? `Despues de ${checkIn.eventName}` : "Ingresa tus metricas del dia siguiente"}
          </p>
        </div>
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl p-5 mb-4 flex flex-col gap-6 card-shadow"
        style={{ background: "var(--surface-1)", border: "1px solid #e8e0ff" }}
      >
        <SleepSlider value={sleep} onChange={setSleep} />
        <div className="h-px" style={{ background: "rgba(131, 110, 249, 0.2)" }} />
        <NumberInput
          icon={Footprints}
          label="Pasos caminados"
          sublabel="Desde que te levantaste"
          value={steps}
          onChange={setSteps}
          placeholder="3200"
          unit="pasos"
          min={0}
          max={30000}
        />
        <div className="h-px" style={{ background: "rgba(131, 110, 249, 0.2)" }} />
        <NumberInput
          icon={Heart}
          label="Pulso en reposo"
          sublabel="Tu frecuencia cardiaca"
          value={bpm}
          onChange={setBpm}
          placeholder="72"
          unit="BPM"
          min={40}
          max={200}
        />
      </div>

      {/* JSON upload */}
      <button
        className="w-full rounded-2xl p-3.5 flex items-center gap-3 mb-6 transition-colors hover:border-[#836ef9]"
        style={{ background: "var(--surface-1)", border: "1px dashed #c4b5fd" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(131, 110, 249, 0.1)" }}
        >
          <Upload className="w-4 h-4" style={{ color: "#a594fb" }} />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium" style={{ color: "#ffffff" }}>Subir JSON de wearable</p>
          <p className="text-xs" style={{ color: "#a594fb" }}>Apple Health, Fitbit o similar</p>
        </div>
      </button>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isValid}
        className={cn(
          "w-full flex items-center justify-center gap-3 font-bold rounded-2xl py-4 text-base transition-all",
          isValid
            ? "text-white bg-gradient-purple glow-purple hover:opacity-90 active:scale-95"
            : "cursor-not-allowed"
        )}
        style={
          !isValid
            ? { background: "rgba(131, 110, 249, 0.2)", color: "#b0a0d8", border: "1px solid #d8ccfa" }
            : {}
        }
      >
        Calcular mi Cruda
      </button>

      <p className="mt-3 text-xs text-center" style={{ color: "#836ef9" }}>
        Tus datos no se almacenan. Solo se usan para calcular el score.
      </p>
    </main>
  )
}

export function ScreenCalculating() {
  const phrases = [
    "Analizando tus BPM...",
    "Contando cuantos vasos tomaste...",
    "Consultando el oraculo on-chain...",
    "Calculando tu cruda...",
  ]

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5 max-w-md mx-auto" style={{ background: "#0a0514" }}>
      {/* Animated glow orb */}
      <div className="relative mb-8">
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: "rgba(131,110,249,0.08)",
            border: "2px solid rgba(131,110,249,0.22)",
            boxShadow: "0 0 60px rgba(131,110,249,0.22)",
          }}
        >
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#836ef9" }} />
        </div>
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "rgba(131,110,249,0.05)" }}
        />
      </div>

      <h2 className="font-bold text-xl text-center mb-2" style={{ color: "#ffffff" }}>
        Calculando tu cruda...
      </h2>
      <p className="text-sm text-center mb-8" style={{ color: "#a594fb" }}>
        El oraculo esta evaluando tus metricas
      </p>

      <div className="w-full max-w-xs space-y-1">
        {phrases.map((phrase, i) => (
          <div
            key={phrase}
            className="flex items-center gap-2.5 py-2 text-sm"
            style={{ color: i === 0 ? "#836ef9" : "#836ef9" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: i === 0 ? "#836ef9" : "rgba(131, 110, 249, 0.2)" }}
            />
            {phrase}
          </div>
        ))}
      </div>
    </main>
  )
}
