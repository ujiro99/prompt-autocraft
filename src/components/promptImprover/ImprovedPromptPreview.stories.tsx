import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { useState } from "react"
import { ImprovedPromptPreview } from "./ImprovedPromptPreview"
import type { ImproveLog } from "@/services/promptImprover/improverService"

const meta = {
  title: "PromptImprover/ImprovedPromptPreview",
  component: ImprovedPromptPreview,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ImprovedPromptPreview>

export default meta
type Story = StoryObj<typeof meta>

// Sample improvement logs
const sampleChangeLogs: ImproveLog[] = [
  {
    start_line: 1,
    end_line: 3,
    description: "Added clearer context about the task objective",
    benefit:
      "Helps the AI understand the specific goal and produce more targeted results",
  },
  {
    start_line: 3,
    end_line: 5,
    description: "Specified the programming language and style requirements",
    benefit:
      "Ensures the output matches expected format and coding conventions",
  },
  {
    start_line: 6,
    end_line: 9,
    description: "Added examples to illustrate the expected behavior",
    benefit:
      "Provides concrete reference points that improve accuracy and reduce ambiguity",
  },
  {
    start_line: 9,
    end_line: 12,
    description: "Added a code example",
    benefit:
      "Gives the AI a clear template to follow, enhancing the quality of the generated code",
  },
]

const sampleImprovedContent = `You are tasked with creating a factorial calculation function.

Write a JavaScript function that:
- Takes a positive integer as input
- Returns the factorial of that number
- Uses recursion for the implementation

Example:
- factorial(5) should return 120
- factorial(0) should return 1
\`\`\`
Please ensure the function handles edge cases appropriately.
function factorial(n) {
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}
\`\`\`

Example 2:
\`\`\`
function factorial(n) {
  if (n < 0) {
    throw new Error("Input must be a non-negative integer.");
  }
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}
\`\`\`
`

// Empty state (before improvement)
export const Empty: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: "",
    isImproving: false,
    improvementError: null,
    changeLog: [],
    hoveredIndex: null,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
    disabled: false,
    isApiKeyConfigured: true,
    improveButtonText: "Improve with AI",
    cancelButtonText: "Cancel",
    improvingPlaceholder: "Improving...",
  },
  decorators: [
    (Story) => (
      <div className="w-[800px]">
        <Story />
      </div>
    ),
  ],
}

// Improving state (loading)
export const Improving: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: "",
    isImproving: true,
    improvementError: null,
    changeLog: [],
    hoveredIndex: null,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
    disabled: false,
    isApiKeyConfigured: true,
    improveButtonText: "Improve with AI",
    cancelButtonText: "Cancel",
    improvingPlaceholder: "Improving...",
  },
  decorators: [
    (Story) => (
      <div className="w-[800px]">
        <Story />
      </div>
    ),
  ],
}

// Error state
export const Error: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: "",
    isImproving: false,
    improvementError:
      "Failed to improve prompt: API key is invalid or the service is unavailable. Please check your settings and try again.",
    changeLog: [],
    hoveredIndex: null,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
    disabled: false,
    isApiKeyConfigured: true,
    improveButtonText: "Improve with AI",
    cancelButtonText: "Cancel",
    improvingPlaceholder: "Improving...",
  },
  decorators: [
    (Story) => (
      <div className="w-[800px]">
        <Story />
      </div>
    ),
  ],
}

// With improved content (no change log)
export const ImprovedNoLogs: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: sampleImprovedContent,
    isImproving: false,
    improvementError: null,
    changeLog: [],
    hoveredIndex: null,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
    disabled: false,
    isApiKeyConfigured: true,
    improveButtonText: "Improve with AI",
    cancelButtonText: "Cancel",
    improvingPlaceholder: "Improving...",
  },
  decorators: [
    (Story) => (
      <div className="w-[800px]">
        <Story />
      </div>
    ),
  ],
}

// With improved content and change logs
export const ImprovedWithLogs: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: sampleImprovedContent,
    isImproving: false,
    improvementError: null,
    changeLog: sampleChangeLogs,
    hoveredIndex: 1,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
    disabled: false,
    isApiKeyConfigured: true,
    improveButtonText: "Improve with AI",
    cancelButtonText: "Cancel",
    improvingPlaceholder: "Improving...",
  },
  decorators: [
    (Story) => (
      <div className="w-4xl">
        <Story />
      </div>
    ),
  ],
}

// No API key configured
export const NoApiKey: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: "",
    isImproving: false,
    improvementError: null,
    changeLog: [],
    hoveredIndex: null,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
    disabled: false,
    isApiKeyConfigured: false,
    improveButtonText: "Improve with AI",
    cancelButtonText: "Cancel",
    improvingPlaceholder: "Improving...",
  },
  decorators: [
    (Story) => (
      <div className="w-[800px]">
        <Story />
      </div>
    ),
  ],
}

// Interactive example with state management
const InteractiveExample = () => {
  const [improvedContent, setImprovedContent] = useState("")
  const [isImproving, setIsImproving] = useState(false)
  const [improvementError, setImprovementError] = useState<string | null>(null)
  const [changeLog, setChangeLog] = useState<ImproveLog[]>([])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleImprove = () => {
    setIsImproving(true)
    setImprovementError(null)
    setImprovedContent("")
    setChangeLog([])

    // Simulate improvement process
    setTimeout(() => {
      setImprovedContent(sampleImprovedContent)
      setChangeLog(sampleChangeLogs)
      setIsImproving(false)
    }, 2000)
  }

  const handleCancelImprovement = () => {
    setIsImproving(false)
    setImprovedContent("")
    setChangeLog([])
    setImprovementError(null)
  }

  return (
    <div className="w-[1200px]">
      <ImprovedPromptPreview
        label="Improved Prompt Preview"
        improvedContent={improvedContent}
        isImproving={isImproving}
        improvementError={improvementError}
        changeLog={changeLog}
        hoveredIndex={hoveredIndex}
        onHoverChange={setHoveredIndex}
        onImprove={handleImprove}
        onCancelImprovement={handleCancelImprovement}
        disabled={false}
        isApiKeyConfigured={true}
        improveButtonText="Improve with AI"
        cancelButtonText="Cancel"
        improvingPlaceholder="Improving..."
      />
    </div>
  )
}

export const Interactive: Story = {
  args: {
    label: "Improved Prompt Preview",
    improvedContent: "",
    isImproving: false,
    improvementError: null,
    changeLog: [],
    hoveredIndex: null,
    onHoverChange: fn(),
    onImprove: fn(),
    onCancelImprovement: fn(),
  },
  render: () => <InteractiveExample />,
}
