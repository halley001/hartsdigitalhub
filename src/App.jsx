import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Harts Digital Hub</h1>
        <p>Software Development & Digital Transformation Solutions</p>
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </div>
        <p className="tagline">
          Building innovative applications and transforming businesses through technology
        </p>
      </header>
    </div>
  )
}

export default App
