"use client"

import { ExternalLink, Copy } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface TxHashBadgeProps {
  txHash: string
  explorerUrl?: string
  className?: string
}

export function TxHashBadge({ txHash, explorerUrl = "#", className }: TxHashBadgeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={cn("relative flex items-center gap-2 rounded-xl px-3 py-2", className)}
      style={{ background: "rgba(131, 110, 249, 0.1)", border: "1px solid #d8ccfa" }}
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
      <span className="font-mono text-xs truncate flex-1" style={{ color: "rgba(131, 110, 249, 0.3)" }}>{txHash}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleCopy}
          className="p-1 rounded transition-colors hover:bg-[#e8e0ff]"
          title="Copiar tx hash"
          style={{ color: "#a594fb" }}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded transition-colors hover:bg-[#e8e0ff]"
          title="Ver en explorador"
          style={{ color: "#a594fb" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      {copied && (
        <span
          className="absolute right-0 -top-8 text-xs px-2 py-1 rounded-lg shadow"
          style={{ background: "var(--surface-1)", border: "1px solid rgba(22, 163, 74, 0.25)", color: "#16a34a" }}
        >
          Copiado
        </span>
      )}
    </div>
  )
}
