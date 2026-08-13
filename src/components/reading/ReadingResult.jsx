import Mascot from '../shared/Mascot'
import MarkdownResult from './MarkdownResult'

export default function ReadingResult({
  user,
  result,
  loading,
  authBusy,
  onLogin,
}) {
  return (
    <>
      {loading && (
        <section className="result result-loading" aria-busy="true" aria-live="polite">
          <img
            src="/assets/loading-cat.png"
            alt="운명의 지도를 분석 중이에요"
            className="loading-cat"
          />
          <span className="sr-only">사주 해석을 불러오는 중입니다.</span>
        </section>
      )}

      {!loading && result && (
        <section className={user ? 'result' : 'result result-gated'}>
          <div className="result-heading">
            <Mascot size="md" />
            <h2>기본 차트 해석</h2>
          </div>
          <MarkdownResult content={result} />
          {!user && (
            <div className="result-gate">
              <p className="result-gate-copy">나머지 해석은 로그인하면 본다냥.</p>
              <button
                type="button"
                className="analyze-btn"
                onClick={() => onLogin('result_gate')}
                disabled={authBusy}
              >
                {authBusy ? '이동 중이라냥...' : 'Google로 들어오면 나머지도 본다냥'}
              </button>
            </div>
          )}
        </section>
      )}
    </>
  )
}
