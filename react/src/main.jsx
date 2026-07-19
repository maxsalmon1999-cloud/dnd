import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './routes/Home'
import DmApp from './dm/DmApp'
import DmRefresh from './dmRefresh/DmRefresh'
import Callback from './routes/Callback'
import RefreshedPlayer from './refreshed/RefreshedPlayer'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dm" element={<DmApp />} />
        {/* refreshed DM screen — trialling the live character-sheet tracker */}
        <Route path="/dm-refresh" element={<DmRefresh />} />
        {/* the refreshed player screen is now THE player screen */}
        <Route path="/play" element={<RefreshedPlayer />} />
        <Route path="/refreshed" element={<RefreshedPlayer />} />
        <Route path="/lab" element={<RefreshedPlayer />} />
        <Route path="/callback" element={<Callback />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
