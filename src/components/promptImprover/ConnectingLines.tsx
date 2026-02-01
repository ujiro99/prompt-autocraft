import { useEffect, useState } from "react"
import type { ImproveLog } from "@/services/promptImprover/improverService"

interface ConnectingLinesProps {
  improvements: ImproveLog[]
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  explanationPanelRef: React.RefObject<HTMLDivElement | null>
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>
  hoveredIndex: number | null
  promptContent: string
}

interface LinePosition {
  x: number
  y: number
}

const CARD_TOP_OFFSET = 20

export const ConnectingLines: React.FC<ConnectingLinesProps> = ({
  improvements,
  textareaRef,
  explanationPanelRef,
  cardRefs,
  hoveredIndex,
}) => {
  const [lines, setLines] = useState<
    Array<{ start: LinePosition; end: LinePosition; isHovered: boolean }>
  >([])
  const [area, setArea] = useState<SVGSVGElement | null>(null)

  useEffect(() => {
    console.log("Setup connecting lines...")

    const calculateLines = () => {
      const textarea = textareaRef.current
      if (!textarea || !cardRefs.current) return
      if (!area) return

      const textareaRect = textarea.getBoundingClientRect()
      const computedStyle = getComputedStyle(textarea)
      const lineHeight = parseFloat(computedStyle.lineHeight) || 20
      const connnectingAreaRect = area.getBoundingClientRect()

      const newLines = improvements.map((improvement, index) => {
        // Calculate bar position (on the left side of connecting area)
        const barTop =
          -textarea.scrollTop +
          (improvement.start_line - 1) * lineHeight +
          ((improvement.end_line - improvement.start_line + 1) * lineHeight) / 2
        const barLeft = 0

        // Calculate card position (on the right side of connecting area)
        const card = cardRefs.current?.[index]
        let cardTop = 0
        const cardLeft = connnectingAreaRect.width // Width of the connecting area

        if (card) {
          const cardRect = card.getBoundingClientRect()
          cardTop = cardRect.top - textareaRect.top + CARD_TOP_OFFSET
        }

        return {
          start: { x: barLeft, y: barTop },
          end: { x: cardLeft, y: cardTop },
          isHovered: hoveredIndex === index,
        }
      })

      setLines(newLines)
    }

    calculateLines()

    // Recalculate on scroll
    const textarea = textareaRef.current
    if (textarea) {
      textarea.addEventListener("scroll", calculateLines)
    }
    const explanationPanel = explanationPanelRef.current
    if (explanationPanel) {
      explanationPanel.addEventListener("scroll", calculateLines)
    }

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateLines)
    if (textarea) {
      resizeObserver.observe(textarea)
    }
    cardRefs.current?.forEach((card) => {
      if (card) resizeObserver.observe(card)
    })

    return () => {
      if (textarea) {
        textarea.removeEventListener("scroll", calculateLines)
      }
      if (explanationPanel) {
        explanationPanel.removeEventListener("scroll", calculateLines)
      }
      resizeObserver.disconnect()
    }
  }, [
    improvements,
    area,
    textareaRef,
    explanationPanelRef,
    cardRefs,
    hoveredIndex,
  ])

  return (
    <svg
      data-testid="connecting-lines"
      className="absolute inset-0 w-full h-full stroke-border"
      ref={setArea}
    >
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.start.x}
          y1={line.start.y}
          x2={line.end.x}
          y2={line.end.y}
          stroke={line.isHovered ? "var(--ph-primary)" : "var(--ph-border)"}
          strokeWidth={line.isHovered ? 2 : 1}
          strokeDasharray={line.isHovered ? "0" : "4 2"}
          className="transition-all duration-200"
        />
      ))}
    </svg>
  )
}
