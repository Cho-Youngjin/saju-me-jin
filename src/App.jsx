import { useState } from 'react'
import './App.css'
import { buildSajuPrompt } from './prompt'
import { requestSajuAnalysis } from './gemini'
import MarkdownResult from './MarkdownResult'

function App() {
  // name: 지금 입력된 이름 값
  // setName: name을 바꾸는 함수
  const [name, setName] = useState('')
  // birthDate: 생년월일 (YYYY-MM-DD)
  const [birthDate, setBirthDate] = useState('')
  // birthTime: 태어난 시간 (HH:MM)
  const [birthTime, setBirthTime] = useState('')
  // gender: 성별 (남자 / 여자)
  const [gender, setGender] = useState('')
  // calendarType: 양력 또는 음력
  const [calendarType, setCalendarType] = useState('')

  // result: Gemini가 돌려준 사주 해석 글
  const [result, setResult] = useState('')
  // loading: API 요청 중이면 true (버튼 중복 클릭 방지)
  const [loading, setLoading] = useState(false)
  // error: 요청 실패 시 보여줄 메시지
  const [error, setError] = useState('')

  // 버튼 클릭 → 프롬프트 만들고 → Gemini API 호출
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
    } catch (err) {
      console.error(err)
      setError(err.message || '사주 해석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <label htmlFor="name">
        이름
        {/*
          value={name}  → input에 보이는 글자를 name 상태와 맞춤
          onChange      → 타이핑할 때마다 setName으로 상태를 갱신
        */}
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
        />
      </label>

      {/* --- 여기부터 추가된 입력 --- */}
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
      {/* --- 추가된 입력 끝 --- */}

      {/* name이 바뀌면 아래 글자도 같이 바뀜 */}
      <p className="preview">{name}님의 사주</p>

      <button
        type="button"
        className="analyze-btn"
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? '풀이 중...' : '내 사주 보기'}
      </button>

      {error && (
        <p className="error" style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {result && (
        <section className="result">
          <h2>기본 차트 해석</h2>
          <MarkdownResult content={result} />
        </section>
      )}
    </div>
  )
}

export default App
