import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { isResultPath, parseResultPath } from './lib/resultRoute.js'
import ResultPage from './pages/ResultPage.jsx'
import './styles/index.css'
import './styles/App.css'

const pathname = window.location.pathname
const readingId = parseResultPath(pathname)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isResultPath(pathname) ? (
      <ResultPage readingId={readingId} />
    ) : (
      <App />
    )}
  </StrictMode>,
)
