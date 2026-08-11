/**
 * Interactions API REST 응답에서 모델 글만 꺼냅니다.
 * (SDK의 output_text는 REST JSON에 없고, steps 안에 들어 있습니다.)
 */
function extractOutputText(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text
  }
  if (typeof data.outputText === 'string' && data.outputText.trim()) {
    return data.outputText
  }

  const texts = []

  for (const step of data.steps ?? []) {
    if (step.type !== 'model_output') continue

    for (const part of step.content ?? []) {
      if (part.type === 'text' && part.text) {
        texts.push(part.text)
      }
    }
  }

  return texts.join('\n').trim()
}

/**
 * Gemini API 호출 (fetch만 사용)
 */
export async function requestSajuAnalysis(prompt) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      'VITE_GEMINI_API_KEY가 없습니다. .env 파일을 확인한 뒤 npm run dev를 다시 실행하세요.'
    )
  }

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/interactions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'gemini-3.6-flash',
        input: prompt,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || `API 오류 (${response.status})`)
  }

  const text = extractOutputText(data)

  if (!text) {
    throw new Error('모델 응답이 비어 있습니다. 잠시 후 다시 시도해 주세요.')
  }

  return text
}
