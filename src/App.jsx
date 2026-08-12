import { useEffect, useState } from 'react'
import './App.css'
import { buildSajuPrompt } from './prompt'
import { requestSajuAnalysis } from './gemini'
import MarkdownResult from './MarkdownResult'
import { supabase } from './supabase'

const READING_COLUMNS =
  'id, name, birth_date, birth_time, gender, calendar_type, result, created_at'

function App() {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthTime, setBirthTime] = useState('')
  const [gender, setGender] = useState('')
  const [calendarType, setCalendarType] = useState('')

  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [readings, setReadings] = useState([])
  const [selectedId, setSelectedId] = useState(null)

  const busy = loading || saving

  function readingPayload(resultText) {
    return {
      name,
      birth_date: birthDate,
      birth_time: birthTime || null,
      gender: gender || null,
      calendar_type: calendarType || null,
      result: resultText,
    }
  }

  async function loadReadings() {
    const { data, error: fetchError } = await supabase
      .from('saju_readings')
      .select(READING_COLUMNS)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error(fetchError)
      setError(fetchError.message || '저장된 사주 목록을 불러오지 못했습니다.')
      return
    }

    setReadings(data ?? [])
  }

  useEffect(() => {
    loadReadings()
  }, [])

  async function handleAnalyze() {
    setLoading(true)
    setError('')
    setResult('')

    try {
      const prompt = buildSajuPrompt({
        name,
        birthDate,
        birthTime,
        gender,
        calendarType,
      })
      const text = await requestSajuAnalysis(prompt)
      setResult(text)

      if (selectedId) {
        const { data, error: updateError } = await supabase
          .from('saju_readings')
          .update(readingPayload(text))
          .eq('id', selectedId)
          .select(READING_COLUMNS)
          .single()

        if (updateError) throw updateError

        setReadings((prev) =>
          prev.map((reading) => (reading.id === data.id ? data : reading))
        )
      } else {
        const { data, error: insertError } = await supabase
          .from('saju_readings')
          .insert(readingPayload(text))
          .select(READING_COLUMNS)
          .single()

        if (insertError) throw insertError

        setReadings((prev) => [data, ...prev])
        setSelectedId(data.id)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!selectedId) return

    setSaving(true)
    setError('')

    try {
      const { data, error: updateError } = await supabase
        .from('saju_readings')
        .update(readingPayload(result))
        .eq('id', selectedId)
        .select(READING_COLUMNS)
        .single()

      if (updateError) throw updateError

      setReadings((prev) =>
        prev.map((reading) => (reading.id === data.id ? data : reading))
      )
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 정보를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedId) return
    if (!window.confirm('이 사주를 삭제할까요?')) return

    setSaving(true)
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('saju_readings')
        .delete()
        .eq('id', selectedId)

      if (deleteError) throw deleteError

      setReadings((prev) => prev.filter((reading) => reading.id !== selectedId))
      handleNewReading()
    } catch (err) {
      console.error(err)
      setError(err.message || '사주를 삭제하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  function handleSelectReading(reading) {
    setSelectedId(reading.id)
    setName(reading.name ?? '')
    setBirthDate(reading.birth_date ?? '')
    setBirthTime(reading.birth_time ? String(reading.birth_time).slice(0, 5) : '')
    setGender(reading.gender ?? '')
    setCalendarType(reading.calendar_type ?? '')
    setResult(reading.result ?? '')
    setError('')
  }

  function handleNewReading() {
    setSelectedId(null)
    setName('')
    setBirthDate('')
    setBirthTime('')
    setGender('')
    setCalendarType('')
    setResult('')
    setError('')
  }

  return (
    <div className="layout">
      <aside className="sidebar" aria-label="저장된 사주 목록">
        <button
          type="button"
          className="new-reading-btn"
          onClick={handleNewReading}
          disabled={busy}
        >
          새 사주 만들기
        </button>
        <h2 className="sidebar-title">저장된 사주</h2>
        {readings.length === 0 ? (
          <p className="sidebar-empty">아직 저장된 사주가 없습니다.</p>
        ) : (
          <ul className="sidebar-list">
            {readings.map((reading) => (
              <li key={reading.id}>
                <button
                  type="button"
                  className={
                    selectedId === reading.id
                      ? 'sidebar-item sidebar-item-active'
                      : 'sidebar-item'
                  }
                  onClick={() => handleSelectReading(reading)}
                  disabled={busy}
                >
                  {reading.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="app">
        <label htmlFor="name">
          이름
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
        </label>

        <label htmlFor="birthDate">
          생년월일
          <input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>

        <label htmlFor="birthTime">
          태어난 시간
          <input
            id="birthTime"
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
          />
        </label>

        <label htmlFor="gender">
          성별
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">선택하세요</option>
            <option value="남자">남자</option>
            <option value="여자">여자</option>
          </select>
        </label>

        <label htmlFor="calendarType">
          양력/음력
          <select
            id="calendarType"
            value={calendarType}
            onChange={(e) => setCalendarType(e.target.value)}
          >
            <option value="">선택하세요</option>
            <option value="양력">양력</option>
            <option value="음력">음력</option>
          </select>
        </label>

        <p className="preview">{name}님의 사주</p>

        <button
          type="button"
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={busy}
        >
          {loading
            ? '풀이 중...'
            : selectedId
              ? '다시 풀이하기'
              : '내 사주 보기'}
        </button>

        {selectedId && (
          <div className="action-row">
            <button
              type="button"
              className="secondary-btn"
              onClick={handleSave}
              disabled={busy}
            >
              {saving ? '저장 중...' : '정보 저장'}
            </button>
            <button
              type="button"
              className="danger-btn"
              onClick={handleDelete}
              disabled={busy}
            >
              삭제
            </button>
          </div>
        )}

        {error && (
          <p className="error" style={{ color: 'red' }}>
            {error}
          </p>
        )}

        {loading && (
          <section className="result" aria-busy="true" aria-live="polite">
            <div className="skeleton skeleton-title" />
            <div className="skeleton-body">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-medium" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line skeleton-line-short" />
            </div>
            <span className="sr-only">사주 해석을 불러오는 중입니다.</span>
          </section>
        )}

        {!loading && result && (
          <section className="result">
            <h2>기본 차트 해석</h2>
            <MarkdownResult content={result} />
          </section>
        )}
      </div>
    </div>
  )
}

export default App
