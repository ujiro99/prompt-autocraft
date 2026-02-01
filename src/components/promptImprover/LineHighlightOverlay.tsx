import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { ImproveLog } from "@/services/promptImprover/improverService"

interface LineHighlightOverlayProps {
  improvements: ImproveLog[]
  hoveredIndex: number | null
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

const OVERLAY_PADDING = 2

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
  const getBarOffset = (index: number) => {
    return index * 4 // Offset by 4px for each overlapping bar
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ transform: `translateY(-${scrollTop}px)` }}
    >
      {/* Render bars for all improvements */}
      {improvements.map((improvement, index) => {
        const top = calculateTop(improvement.start_line)
        const height = calculateHeight(
          improvement.start_line,
          improvement.end_line,
        )
        const rightOffset = 2 + getBarOffset(index)

        return (
          <div
            key={`bar-${index}`}
            className={cn(
              "absolute w-1 rounded-full transition-all duration-200",
              hoveredIndex === index ? "bg-primary z-10" : "bg-primary/40 z-0",
            )}
            style={{
              top: `${top}px`,
              height: `${height}px`,
              right: `${rightOffset}px`,
            }}
          />
        )
      })}

      {/* Render highlight for hovered improvement */}
      {hoveredIndex !== null && improvements[hoveredIndex] && (
        <div
          className="absolute bg-primary/10 rounded-sm left-1.5 right-1.5"
          style={{
            top: `${calculateTop(improvements[hoveredIndex].start_line)}px`,
            height: `${calculateHeight(
              improvements[hoveredIndex].start_line,
              improvements[hoveredIndex].end_line,
            )}px`,
          }}
        />
      )}
    </div>
  )
}
