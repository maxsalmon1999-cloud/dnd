import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './routes/Home'
import DmApp from './dm/DmApp'
import PlayerApp from './player/PlayerApp'
import Callback from './routes/Callback'
import LabPlayer from './lab/LabPlayer'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dm" element={<DmApp />} />
        <Route path="/play" element={<PlayerApp />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/lab" element={<LabPlayer />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
