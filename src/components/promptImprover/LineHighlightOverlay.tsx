import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import type { ImproveLog } from "@/services/promptImprover/improverService"

interface BarPosition {
  top: number
  height: number
  rightOffset?: number
}

interface LineHighlightOverlayProps {
  improvements: ImproveLog[]
  hoveredIndex: number | null
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

const OVERLAY_PADDING = 2
const BAR_INTERCEPT = 4
const BAR_OFFSET = 6

export const LineHighlightOverlay: React.FC<LineHighlightOverlayProps> = ({
  improvements,
  hoveredIndex,
  textareaRef,
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [lineHeight, setLineHeight] = useState(20)
  const [paddingTop, setPaddingTop] = useState(8)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Calculate line height
    const computedStyle = getComputedStyle(textarea)
    const computedLineHeight = parseFloat(computedStyle.lineHeight)
    if (!isNaN(computedLineHeight)) {
      setLineHeight(computedLineHeight)
    }

    // Calculate padding top
    const computedPaddingTop = parseFloat(computedStyle.paddingTop)
    if (!isNaN(computedPaddingTop)) {
      setPaddingTop(computedPaddingTop)
    }

    // Sync scroll position
    const handleScroll = () => {
      setScrollTop(textarea.scrollTop)
    }

    textarea.addEventListener("scroll", handleScroll)
    return () => textarea.removeEventListener("scroll", handleScroll)
  }, [textareaRef])

  const positions: BarPosition[] = useMemo(() => {
    const calculateTop = (lineNumber: number) => {
      return (lineNumber - 1) * lineHeight + paddingTop - OVERLAY_PADDING
    }

    const calculateHeight = (startLine: number, endLine: number) => {
      return Math.max(
        (endLine - startLine + 1) * lineHeight + OVERLAY_PADDING * 2,
        12,
      ) // minimum 12px
    }

    // Group improvements by overlap to offset bars
    const getBarOffset = (
      positions: BarPosition[],
      idx: number,
      top: number,
    ) => {
      // Check for overlaps with existing positions
      const overlaps = positions.filter((pos) => {
        const bottom = pos.top + pos.height
        return top >= pos.top && top <= bottom
      })

      // If there are overlapping bars, calculate the smallest offset that doesn't overlap.
      const overlapCount = overlaps.length
      for (let i = 0; i <= overlapCount; i++) {
        const offset = BAR_INTERCEPT + i * BAR_OFFSET
        const hasConflict = overlaps.some((pos) => pos.rightOffset === offset)
        if (!hasConflict) {
          return offset
        }
      }

      return BAR_INTERCEPT + idx * BAR_OFFSET
    }

    return improvements.reduce((acc, improvement, idx) => {
      const top = calculateTop(improvement.start_line)
      const height = calculateHeight(
        improvement.start_line,
        improvement.end_line,
      )
      const rightOffset = getBarOffset(acc, idx, top)
      acc.push({ top, height, rightOffset })
      return acc
    }, [] as BarPosition[])
  }, [improvements, lineHeight, paddingTop])

  return (
    <div
      className="absolute inset-1 pointer-events-none"
      style={{ transform: `translateY(-${scrollTop}px)` }}
    >
      {/* Render bars for all improvements */}
      {improvements.map((_, index) => (
        <div
          key={`bar-${index}`}
          className={cn(
            "absolute w-1 rounded-full transition-all duration-200",
            hoveredIndex === index ? "bg-primary z-10" : "bg-primary/40 z-0",
          )}
          style={{
            top: `${positions[index].top}px`,
            height: `${positions[index].height}px`,
            right: `${positions[index].rightOffset}px`,
          }}
        />
      ))}

      {/* Render highlight for hovered improvement */}
      {hoveredIndex !== null && positions[hoveredIndex] && (
        <div
          className="absolute bg-primary/10 rounded-sm left-1.5 right-1.5"
          style={{
            top: `${positions[hoveredIndex].top}px`,
            height: `${positions[hoveredIndex].height}px`,
          }}
        />
      )}
    </div>
  )
}
