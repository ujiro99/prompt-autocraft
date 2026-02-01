/**
 * Get the browser's UI language.
 * @returns The UI language code (e.g., 'en', 'fr').
 */
export const getUILanguage = (): string => {
  return browser.i18n.getUILanguage()
}
