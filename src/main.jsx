import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ResultPage from './ResultPage.jsx'
import { isResultPath, parseResultPath } from './resultRoute.js'

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
