import React, { useEffect, useMemo, useRef, useState } from "react"
import { motion, animate, useMotionValue } from "framer-motion"

export type Point = {
  x: number
  y: number
  label?: string
}

type OrderTrackerProps = {
  points: Point[]
  width?: number
  height?: number
  /** Seconds to go from start to end */
  durationSeconds?: number
}

function buildSmoothPath(points: Point[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  const d: string[] = []
  d.push(`M ${points[0].x} ${points[0].y}`)

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2
    const midY = (current.y + next.y) / 2
    // Quadratic curves between midpoints for a smooth S-curve look
    if (i === 0) {
      d.push(`Q ${current.x} ${current.y} ${midX} ${midY}`)
    } else {
      const prev = points[i - 1]
      const ctrlX = current.x + (next.x - prev.x) * 0.15
      const ctrlY = current.y + (next.y - prev.y) * 0.15
      d.push(`Q ${ctrlX} ${ctrlY} ${midX} ${midY}`)
    }
    if (i === points.length - 2) {
      d.push(`T ${next.x} ${next.y}`)
    }
  }

  return d.join(" ")
}

export function OrderTracker({
  points,
  width = 640,
  height = 280,
  durationSeconds = 12,
}: OrderTrackerProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)
  const [carPos, setCarPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const progress = useMotionValue(0)

  const pathD = useMemo(() => buildSmoothPath(points), [points])

  // Pre-calc straight-line segment ratios to highlight points as we pass them
  const segmentRatios = useMemo(() => {
    if (points.length < 2) return points.map(() => 0)
    const lengths: number[] = []
    let total = 0
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x
      const dy = points[i + 1].y - points[i].y
      const len = Math.hypot(dx, dy)
      lengths.push(len)
      total += len
    }
    let acc = 0
    return points.map((_, idx) => {
      if (idx === 0) return 0
      if (idx === points.length - 1) return 1
      acc += lengths[idx - 1]
      return acc / total
    })
  }, [points])

  useEffect(() => {
    const node = pathRef.current
    if (!node) return
    const len = node.getTotalLength()
    setPathLength(len)

    const unsubscribe = progress.on("change", (v) => {
      const dist = len * v
      const point = node.getPointAtLength(dist)
      setCarPos({ x: point.x, y: point.y })
    })

    const controls = animate(progress, 1, {
      duration: durationSeconds,
      repeat: Infinity,
      ease: "easeInOut",
    })

    return () => {
      controls.stop()
      unsubscribe?.()
    }
  }, [progress, durationSeconds, pathD])

  if (!points.length) return null

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ maxWidth: width }}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Path */}
        <motion.path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke="url(#trackGradient)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />

        {/* Points */}
        {points.map((p, idx) => {
          const isPassed = progress.get() >= segmentRatios[idx] - 0.001
          return (
            <g key={`${p.x}-${p.y}-${idx}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r={10}
                fill={isPassed ? "#22d3ee" : "#cbd5e1"}
                stroke="#0ea5e9"
                strokeWidth={2}
              />
              {p.label ? (
                <text
                  x={p.x + 14}
                  y={p.y - 14}
                  fontSize={12}
                  fontWeight={600}
                  fill="#0f172a"
                  style={{ pointerEvents: "none" }}
                >
                  {p.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {/* Car icon following the path */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          transform={`translate(${carPos.x - 14}, ${carPos.y - 10})`}
        >
          <rect x={0} y={6} width={28} height={12} rx={6} fill="#111827" />
          <rect x={4} y={0} width={20} height={10} rx={5} fill="#f97316" />
          <circle cx={7} cy={19} r={5} fill="#0ea5e9" stroke="#0f172a" strokeWidth={2} />
          <circle cx={21} cy={19} r={5} fill="#0ea5e9" stroke="#0f172a" strokeWidth={2} />
          <rect x={6} y={3} width={16} height={4} fill="#1f2937" />
        </motion.g>
      </svg>
    </div>
  )
}

export default OrderTracker
