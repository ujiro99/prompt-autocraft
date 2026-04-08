import ReactDOM from "react-dom/client"
import App from "./content/App.tsx"
import "./content/App.css"
import { supportHosts } from "@/services/aiService"
import { analyticsService } from "@/services/analytics"
import { DebugInterface } from "@/services/debug/debugInterface"

// Initialize console filter to suppress Radix DialogTitle warning in production
// This warning appears because Radix uses document.getElementById() which doesn't work with Shadow DOM
// All Dialog components properly include DialogTitle, so this warning is harmless
// See: https://github.com/radix-ui/primitives/issues/1386
if (!import.meta.env.DEV) {
  const originalConsoleError = console.error
  console.error = (...args: unknown[]) => {
    const message = args[0]
    // Filter out ONLY the exact Radix DialogTitle warning
    // Match the exact structure of the Radix warning message with backticks
    if (
      typeof message === "string" &&
      message.includes("`DialogContent` requires a `DialogTitle`") &&
      message.includes("for the component to be accessible for screen reader users")
    ) {
      // In production, suppress this specific warning as it's a false positive due to Shadow DOM
      // In dev mode this check is skipped so developers can see all warnings
      return
    }
    // Pass through all other errors unchanged
    originalConsoleError.apply(console, args)
  }
}

let _supportHosts = [...supportHosts]

// Exclude development host from production. However, include it for E2E tests
if (
  import.meta.env.MODE === "production" &&
  import.meta.env.WXT_E2E !== "true"
) {
  _supportHosts = supportHosts.filter((host) => host !== "ujiro99.github.io")
}

const matches = _supportHosts.map((hostname) => `https://${hostname}/*`)

export default defineContentScript({
  matches,
  cssInjectionMode: "ui",
  runAt: "document_end",

  async main(ctx) {
    // Wait until the ChatGPT page is fully loaded
    await new Promise((resolve) => {
      if (document.readyState === "complete") {
        resolve(void 0)
      } else {
        window.addEventListener("load", () => resolve(void 0))
      }
    })

    // Wait additional time for ChatGPT UI to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const ui = await createShadowRootUi(ctx, {
      name: "prompt-autocraft-ui",
      position: "inline",
      anchor: "body",
      onMount: (container) => {
        analyticsService.autoTrack(container)
        const app = document.createElement("div")
        container.append(app)
        const root = ReactDOM.createRoot(app)
        root.render(<App />)
        return root
      },
      onRemove: (root) => {
        root?.unmount()
      },
    })

    ui.mount()

    // Expose debug interface in non-production environments
    if (import.meta.env.MODE !== "production") {
      window.debug = DebugInterface.getInstance()
      console.log("🔍 Debug interface available at window.promptHistoryDebug")
    }
  },
})
