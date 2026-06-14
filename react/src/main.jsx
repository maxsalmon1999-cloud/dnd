import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './routes/Home'
import DmScreen from './routes/DmScreen'
import PlayerScreen from './routes/PlayerScreen'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dm" element={<DmScreen />} />
        <Route path="/play" element={<PlayerScreen />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
