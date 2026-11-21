import { useEffect, useState } from 'react'
import Landing from './components/Landing.jsx'
import Viewer from './components/viewer/Viewer.jsx'
import Wizard from './components/Wizard.jsx'
import './App.css'

function viewerOpen() {
  const path = window.location.pathname.replace(/\/+$/, '')
  const hash = window.location.hash
  return path.endsWith('/view') || hash.includes('draft=') || hash.includes('s=')
}

export default function App() {
  const [mode, setMode] = useState(() => (viewerOpen() ? 'viewer' : 'landing'))

  useEffect(() => {
    const sync = () => {
      if (viewerOpen()) setMode('viewer')
    }
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [mode])

  if (mode === 'viewer') return <Viewer />
  return (
    <main>
      {mode === 'landing' ? (
        <Landing onCreate={() => setMode('wizard')} />
      ) : (
        <Wizard onExit={() => setMode('landing')} />
      )}
    </main>
  )
}
