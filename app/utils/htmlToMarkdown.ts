/**
 * htmlToMarkdown utility
 *
 * Builds a {@link TurndownService} instance preconfigured for converting
 * rich-text pasted from Jira, MS Word, Confluence and similar sources into
 * sensible GitHub Flavored Markdown.
 *
 * Out of the box Turndown does not support tables and falls back to indented
 * code blocks. On top of that, Jira wraps code in deeply nested `<div>`
 * structures and encodes the language in attributes such as
 * `data-syntaxhighlighter-params="brush: java;"`, which the default rules do
 * not understand. This module centralizes the configuration and the custom
 * rules required to handle those cases so the conversion can be reused and
 * unit-tested independently of the UI components.
 */

import TurndownService from 'turndown'
// The package ships no type declarations; import via untyped path.
// @ts-expect-error - no type declarations are published for this package
import { gfm } from '@joplin/turndown-plugin-gfm'

type TurndownPlugin = (service: TurndownService) => void

/**
 * Regex to detect a SyntaxHighlighter "brush" hint such as
 * `brush: java;` or `brush: js; gutter:false`.
 */
const BRUSH_LANGUAGE_RE = /brush\s*:\s*([a-z0-9+#-]+)/i

/**
 * Regex to detect a `language-xxx` or `lang-xxx` class.
 */
const LANGUAGE_CLASS_RE = /(?:^|\s)(?:language|lang|highlight-source)-([a-z0-9+#-]+)/i

/**
 * Extract a code language hint from a `<pre>` / `<code>` / Jira code panel
 * element. Returns an empty string if no hint is found.
 */
function detectCodeLanguage(node: HTMLElement): string {
  const direct
    = node.getAttribute('data-language')
      ?? node.getAttribute('data-lang')
      ?? node.getAttribute('lang')
  if (direct) return direct.trim().toLowerCase()

  const params = node.getAttribute('data-syntaxhighlighter-params')
  if (params) {
    const match = params.match(BRUSH_LANGUAGE_RE)
    if (match) return match[1]!.toLowerCase()
  }

  const className = node.getAttribute('class') ?? ''
  const brushMatch = className.match(BRUSH_LANGUAGE_RE)
  if (brushMatch) return brushMatch[1]!.toLowerCase()

  const langMatch = className.match(LANGUAGE_CLASS_RE)
  if (langMatch) return langMatch[1]!.toLowerCase()

  return ''
}

/**
 * Find the first descendant `<pre>` element of a node, if any.
 */
function findDescendantPre(node: HTMLElement): HTMLElement | null {
  if (typeof node.querySelector === 'function') {
    return node.querySelector('pre')
  }
  return null
}

/**
 * Read the raw text content of a code-like node, preserving line breaks
 * encoded as `<br>` (commonly used in Jira "noformat" panels).
 */
function readCodeText(node: HTMLElement): string {
  const html = node.innerHTML
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li)>/gi, '\n')
  const doc = node.ownerDocument ?? globalThis.document
  const tmp = doc.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent ?? ''
}

/**
 * Format a fenced code block, picking a fence length that is guaranteed to be
 * longer than any backtick run inside the body.
 */
function formatFencedCode(code: string, language: string): string {
  const cleaned = code.replace(/\n+$/, '')
  const longestRun = (cleaned.match(/`+/g) ?? []).reduce(
    (max, run) => Math.max(max, run.length),
    0,
  )
  const fence = '`'.repeat(Math.max(3, longestRun + 1))
  return `\n\n${fence}${language}\n${cleaned}\n${fence}\n\n`
}

/**
 * Custom rule that converts Jira / Confluence code panels — typically
 * `<div class="code panel">` or `<div class="preformatted panel">` containing
 * a `<pre>` — into fenced code blocks while preserving any language hint.
 */
const jiraCodePanelRule: TurndownPlugin = (service) => {
  service.addRule('jiraCodePanel', {
    filter(node) {
      if (node.nodeName !== 'DIV') return false
      const el = node as HTMLElement
      const className = el.getAttribute('class') ?? ''
      const isCodePanel = /(^|\s)(code|preformatted)(\s|$)/.test(className)
        && /(^|\s)panel(\s|$)/.test(className)
      if (!isCodePanel) return false
      return findDescendantPre(el) !== null
    },
    replacement(_content, node) {
      const el = node as HTMLElement
      const pre = findDescendantPre(el)
      if (!pre) return ''
      const language = detectCodeLanguage(pre) || detectCodeLanguage(el)
      return formatFencedCode(readCodeText(pre), language)
    },
  })
}

/**
 * Custom rule that improves the default `<pre>` handling: it always emits a
 * fenced block (regardless of whether a `<code>` child is present) and picks
 * up language hints from non-standard attributes used by Jira/Confluence
 * (`data-syntaxhighlighter-params`, `class="brush: java"`, ...).
 */
const fencedPreRule: TurndownPlugin = (service) => {
  service.addRule('fencedPre', {
    filter(node) {
      return node.nodeName === 'PRE'
    },
    replacement(_content, node) {
      const el = node as HTMLElement
      const codeChild = el.querySelector('code')
      const target = codeChild ?? el
      const language = detectCodeLanguage(target) || detectCodeLanguage(el)
      return formatFencedCode(readCodeText(target), language)
    },
  })
}

/**
 * Custom rule that flattens Jira status lozenges
 * (`<span class="status-macro aui-lozenge">DONE</span>`) to their inner text,
 * preventing them from being rendered as raw HTML in the resulting Markdown.
 */
const jiraLozengeRule: TurndownPlugin = (service) => {
  service.addRule('jiraLozenge', {
    filter(node) {
      if (node.nodeName !== 'SPAN') return false
      const className = (node as HTMLElement).getAttribute('class') ?? ''
      return /aui-lozenge|status-macro/.test(className)
    },
    replacement(content) {
      return content.trim()
    },
  })
}

/**
 * Build a {@link TurndownService} configured for rich-text → Markdown
 * conversion that handles common Jira / Confluence / GitHub HTML.
 *
 * The service supports:
 * - GitHub Flavored Markdown tables, strikethrough and task lists
 * - Fenced code blocks with language detection
 * - Jira code / preformatted panels
 * - Jira status lozenges
 */
export function createRichTextTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
  })

  service.use(gfm as TurndownPlugin)
  // Jira-specific rules need to be registered AFTER gfm so that they win for
  // the elements they target (Turndown picks the rule registered last).
  jiraCodePanelRule(service)
  fencedPreRule(service)
  jiraLozengeRule(service)

  return service
}

/**
 * Convenience helper that builds a service on demand and converts a single
 * HTML string. For repeated conversions prefer caching the service returned
 * by {@link createRichTextTurndownService}.
 */
export function htmlToMarkdown(html: string): string {
  return createRichTextTurndownService().turndown(html)
}
