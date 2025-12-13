import { TestApi } from './components/TestApi'
import './App.css'

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#ffffff',
      color: '#213547',
      padding: '20px'
    }}>
      <h1 style={{ marginTop: 0 }}>Where The Ball Moves - API Test</h1>
      <TestApi />
    </div>
  )
}

export default App
