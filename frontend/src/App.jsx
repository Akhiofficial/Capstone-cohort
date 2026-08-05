import { useSandbox } from './hooks/useSandbox'
import LandingPage from './components/LandingPage'
import WorkspaceLayout from './components/WorkspaceLayout'
import './App.css'

function App() {
  const { sandboxId, previewUrl, status, startSandbox, reset } = useSandbox()

  if (status === 'ready' && sandboxId && previewUrl) {
    return (
      <WorkspaceLayout
        sandboxId={sandboxId}
        previewUrl={previewUrl}
        onReset={reset}
      />
    )
  }

  return <LandingPage onStart={startSandbox} />
}

export default App
