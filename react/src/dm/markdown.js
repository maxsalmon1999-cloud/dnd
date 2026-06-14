// Minimal markdown renderer for AI replies, ported from the original.
// Supports ## - #### headings, * / - lists, **bold**, *italic*. Returns an HTML
// string for use with dangerouslySetInnerHTML (input is escaped first).

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function applyInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
}

export function renderAssistantMarkdown(text) {
  const escaped = escapeHtml(text).replace(/\r\n?/g, '\n')
  const lines = escaped.split('\n')
  const blocks = []
  let paragraph = []
  let listItems = []

  const flushParagraph = () => {
    if (paragraph.length) blocks.push('<p>' + applyInline(paragraph.join(' ')) + '</p>')
    paragraph = []
  }
  const flushList = () => {
    if (listItems.length) blocks.push('<ul>' + listItems.map((i) => '<li>' + applyInline(i) + '</li>').join('') + '</ul>')
    listItems = []
  }

  lines.forEach((line) => {
    const t = line.trim()
    if (!t) {
      flushParagraph()
      flushList()
      return
    }
    const heading = t.match(/^(#{2,4})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = Math.min(4, heading[1].length)
      blocks.push(`<h${level}>${applyInline(heading[2])}</h${level}>`)
      return
    }
    const list = t.match(/^[*-]\s+(.+)$/)
    if (list) {
      flushParagraph()
      listItems.push(list[1])
      return
    }
    flushList()
    paragraph.push(t)
  })

  flushParagraph()
  flushList()
  return blocks.join('')
}

export function renderUserText(text) {
  return escapeHtml(text).replace(/\n/g, '<br>')
}
