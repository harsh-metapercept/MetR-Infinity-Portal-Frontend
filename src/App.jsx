import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './components/Homepage'
import Documentation from './components/Documentation'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#fbf8f8]">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/documentation/:branchName" element={<Documentation />} />
          <Route path="/documentation" element={<Documentation />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
