import { useEffect, useRef, useState } from 'react'
import type { ImproveLog } from '@/services/promptImprover/improverService'

// Constants
const SCROLL_THROTTLE_MS = 16 // 60fps

interface UseScrollSyncParams {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  panelRef: React.RefObject<HTMLDivElement | null>
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>
  improvements: ImproveLog[]
  enabled?: boolean
}

interface UseScrollSyncReturn {
  centerLineNumber: number | null
  syncedImprovementIndex: number | null
}

/**
 * Get the line height of the textarea
 */
function getTextareaLineHeight(textarea: HTMLTextAreaElement): number {
  const computedStyle = getComputedStyle(textarea)
  const lineHeight = parseFloat(computedStyle.lineHeight)
  return isNaN(lineHeight) ? 20 : lineHeight
}

/**
 * Calculate the line number at the center of the textarea viewport
 */
function getCenterLineNumber(
  textarea: HTMLTextAreaElement,
  lineHeight: number,
): number {
  const { scrollTop, clientHeight } = textarea
  return Math.floor((scrollTop + clientHeight / 2) / lineHeight)
}

/**
 * Find the improvement that contains or is closest to the given line number
 * @returns The index of the improvement, or null if no improvements exist
 */
function findImprovementAtLine(
  improvements: ImproveLog[],
  lineNumber: number,
): number | null {
  if (improvements.length === 0) {
    return null
  }

  // Find exact match first
  for (let i = 0; i < improvements.length; i++) {
    const imp = improvements[i]
    if (lineNumber >= imp.start_line && lineNumber <= imp.end_line) {
      return i
    }
  }

  // Find closest improvement by distance
  let closestIndex = 0
  let minDistance = Math.abs(improvements[0].start_line - lineNumber)

  for (let i = 1; i < improvements.length; i++) {
    const distance = Math.abs(improvements[i].start_line - lineNumber)
    if (distance < minDistance) {
      minDistance = distance
      closestIndex = i
    }
  }

  return closestIndex
}

/**
 * Scroll the panel to show the improvement card at the specified index
 */
function scrollPanelToImprovement(
  improvementIndex: number,
  panelRef: React.RefObject<HTMLDivElement | null>,
  cardRefs: React.RefObject<(HTMLDivElement | null)[]>,
): void {
  const panel = panelRef.current
  const card = cardRefs.current?.[improvementIndex]

  if (!panel || !card) return

  // Calculate card position relative to panel viewport
  const panelRect = panel.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()

  // Calculate scroll position to center the card in the viewport
  const cardTopRelativeToPanel =
    cardRect.top - panelRect.top + panel.scrollTop
  const targetScrollTop =
    cardTopRelativeToPanel - panel.clientHeight / 2 + cardRect.height / 2

  panel.scrollTo({
    top: Math.max(0, targetScrollTop),
    behavior: 'smooth',
  })
}

/**
 * Custom hook to synchronize scrolling between textarea and improvement panel
 * When the textarea scrolls, the panel will automatically scroll to show the
 * improvement card that corresponds to the line at the center of the textarea viewport.
 */
export function useScrollSync(
  params: UseScrollSyncParams,
): UseScrollSyncReturn {
  const { textareaRef, panelRef, cardRefs, improvements, enabled = true } =
    params

  const [centerLineNumber, setCenterLineNumber] = useState<number | null>(null)
  const [syncedImprovementIndex, setSyncedImprovementIndex] = useState<
    number | null
  >(null)

  const rafIdRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lastIndexRef = useRef<number | null>(null)

  useEffect(() => {
    if (!enabled || !textareaRef.current || improvements.length === 0) {
      return
    }

    const textarea = textareaRef.current
    const lineHeight = getTextareaLineHeight(textarea)

    const handleScroll = () => {
      if (rafIdRef.current !== null) {
        return // Already scheduled
      }

      rafIdRef.current = requestAnimationFrame((timestamp) => {
        rafIdRef.current = null

        // Throttle to 60fps
        if (timestamp - lastTimeRef.current < SCROLL_THROTTLE_MS) {
          return
        }
        lastTimeRef.current = timestamp

        // Calculate center line
        const centerLine = getCenterLineNumber(textarea, lineHeight)
        setCenterLineNumber(centerLine)

        // Find improvement at center
        const improvementIndex = findImprovementAtLine(improvements, centerLine)

        // Only scroll if improvement changed
        if (
          improvementIndex !== null &&
          improvementIndex !== lastIndexRef.current
        ) {
          scrollPanelToImprovement(improvementIndex, panelRef, cardRefs)
          lastIndexRef.current = improvementIndex
          setSyncedImprovementIndex(improvementIndex)
        }
      })
    }

    textarea.addEventListener('scroll', handleScroll)

    return () => {
      textarea.removeEventListener('scroll', handleScroll)
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [enabled, textareaRef, panelRef, cardRefs, improvements])

  return { centerLineNumber, syncedImprovementIndex }
}
