/**
 * Vite plugin to remove Radix Dialog accessibility warnings in production builds
 * These warnings appear because Radix uses document.getElementById() which doesn't
 * work with Shadow DOM, even though all Dialog components properly include DialogTitle
 * See: https://github.com/radix-ui/primitives/issues/1386
 *
 * This plugin modifies the Radix code during build time, not at runtime,
 * so it doesn't affect the host page's behavior
 */
export function removeRadixWarnings() {
  return {
    name: "remove-radix-warnings",
    enforce: "post" as const,
    transform(code: string, id: string) {
      // Only process Radix dialog module
      if (!id.includes("@radix-ui/react-dialog")) {
        return null
      }

      // Remove the console.error call that emits the DialogTitle warning
      // Match the pattern of the warning check and remove it
      const modifiedCode = code.replace(
        /if\s*\(!hasTitle\)\s*console\.error\(MESSAGE\);?/g,
        "// Radix DialogTitle warning suppressed for Shadow DOM compatibility",
      )

      // Also try to match minified versions
      const modifiedCode2 = modifiedCode.replace(
        /\w+\|\|console\.error\(\w+\)/g,
        (match) => {
          // Only replace if it looks like the Radix warning pattern
          if (code.includes("DialogContent") && code.includes("DialogTitle")) {
            return match.replace(/console\.error\([^)]+\)/, "void 0")
          }
          return match
        },
      )

      if (modifiedCode2 !== code) {
        return {
          code: modifiedCode2,
          map: null,
        }
      }

      return null
    },
  }
}
