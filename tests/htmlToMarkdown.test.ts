import { describe, expect, it } from 'bun:test'
import { createRichTextTurndownService, htmlToMarkdown } from '../app/utils/htmlToMarkdown'

describe('htmlToMarkdown', () => {
  it('converts basic formatting', () => {
    const md = htmlToMarkdown('<p>Hello <strong>world</strong></p>')
    expect(md).toContain('Hello **world**')
  })

  it('converts GFM tables', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Name</th><th>Points</th></tr>
        </thead>
        <tbody>
          <tr><td>Task A</td><td>3</td></tr>
          <tr><td>Task B</td><td>5</td></tr>
        </tbody>
      </table>
    `
    const md = htmlToMarkdown(html)
    expect(md).toContain('| Name | Points |')
    expect(md).toContain('| --- | --- |')
    expect(md).toMatch(/\| Task A \| 3\s*\|/)
    expect(md).toMatch(/\| Task B \| 5\s*\|/)
  })

  it('converts plain <pre><code> blocks to fenced code', () => {
    const md = htmlToMarkdown('<pre><code>const x = 1\nconst y = 2</code></pre>')
    expect(md).toContain('```')
    expect(md).toContain('const x = 1')
    expect(md).toContain('const y = 2')
    // Should NOT use the default 4-space indented style
    expect(md).not.toMatch(/^ {4}const x = 1/m)
  })

  it('detects language from a language-xxx class on <code>', () => {
    const md = htmlToMarkdown(
      '<pre><code class="language-javascript">let a = 1;</code></pre>',
    )
    expect(md).toContain('```javascript')
    expect(md).toContain('let a = 1;')
  })

  it('converts a Jira code panel into a fenced code block with language', () => {
    const html = `
      <div class="code panel pdl" style="border-width: 1px;">
        <div class="codeHeader panelHeader pdl"><b>Snippet</b></div>
        <div class="codeContent panelContent pdl">
          <pre class="syntaxhighlighter-pre" data-syntaxhighlighter-params="brush: java; gutter: false">public class A { }</pre>
        </div>
      </div>
    `
    const md = htmlToMarkdown(html)
    expect(md).toContain('```java')
    expect(md).toContain('public class A { }')
  })

  it('converts a Jira "noformat" / preformatted panel into a fenced code block', () => {
    const html = `
      <div class="preformatted panel">
        <div class="preformattedContent panelContent">
          <pre>line one<br>line two</pre>
        </div>
      </div>
    `
    const md = htmlToMarkdown(html)
    // The fenced block should be present and preserve both lines.
    expect(md).toMatch(/```[\s\S]*line one[\s\S]*line two[\s\S]*```/)
  })

  it('flattens Jira status lozenges to their text content', () => {
    const html = '<p>Status: <span class="status-macro aui-lozenge aui-lozenge-success">DONE</span></p>'
    const md = htmlToMarkdown(html)
    expect(md).toContain('Status: DONE')
    expect(md).not.toContain('<span')
    expect(md).not.toContain('aui-lozenge')
  })

  it('converts strikethrough text', () => {
    const md = htmlToMarkdown('<p><del>old</del></p>')
    expect(md).toContain('~~old~~')
  })

  it('converts GFM task list items', () => {
    const html = `
      <ul>
        <li><input type="checkbox" checked> done item</li>
        <li><input type="checkbox"> open item</li>
      </ul>
    `
    const md = htmlToMarkdown(html)
    expect(md).toContain('[x]')
    expect(md).toContain('[ ]')
  })

  it('escapes backticks inside code by using a longer fence', () => {
    const service = createRichTextTurndownService()
    const md = service.turndown('<pre><code>some ``` ticks</code></pre>')
    // The outer fence must be longer than the inner backtick run.
    expect(md).toMatch(/````+\n?some ``` ticks/)
  })
})
