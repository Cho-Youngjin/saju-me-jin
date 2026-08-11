/**
 * Gemini 응답의 흔한 마크다운만 간단히 HTML로 바꿔 보여줍니다.
 * (제목 / 굵게 / 기울임 / 목록 / 구분선 / 문단)
 */
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatInline(text) {
  let html = escapeHtml(text)
  // **굵게**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // *기울임* (굵게 처리 후 남은 것만)
  html = html.replace(/(^|[^*])\*(?!\s)(.+?)(?!\s)\*(?!\*)/g, '$1<em>$2</em>')
  return html
}

export default function MarkdownResult({ content }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let listItems = []
  let listType = null

  function flushList() {
    if (!listItems.length) return
    const tag = listType === 'ol' ? 'ol' : 'ul'
    blocks.push({
      type: 'list',
      tag,
      items: listItems,
    })
    listItems = []
    listType = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      flushList()
      continue
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      flushList()
      blocks.push({ type: 'hr' })
      continue
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flushList()
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        text: heading[2],
      })
      continue
    }

    const ul = trimmed.match(/^[-*]\s+(.+)$/)
    if (ul) {
      if (listType && listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(ul[1])
      continue
    }

    const ol = trimmed.match(/^\d+\.\s+(.+)$/)
    if (ol) {
      if (listType && listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(ol[1])
      continue
    }

    flushList()
    blocks.push({ type: 'paragraph', text: trimmed })
  }

  flushList()

  return (
    <div className="result-markdown">
      {blocks.map((block, i) => {
        if (block.type === 'hr') {
          return <hr key={i} />
        }

        if (block.type === 'heading') {
          const Tag = `h${block.level}`
          return (
            <Tag
              key={i}
              dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
            />
          )
        }

        if (block.type === 'list') {
          const Tag = block.tag
          return (
            <Tag key={i}>
              {block.items.map((item, j) => (
                <li
                  key={j}
                  dangerouslySetInnerHTML={{ __html: formatInline(item) }}
                />
              ))}
            </Tag>
          )
        }

        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: formatInline(block.text) }}
          />
        )
      })}
    </div>
  )
}
