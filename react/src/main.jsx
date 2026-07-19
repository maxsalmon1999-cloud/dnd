import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './routes/Home'
import DmRefresh from './dmRefresh/DmRefresh'
import Callback from './routes/Callback'
import RedirectTo from './routes/RedirectTo'
import RefreshedPlayer from './refreshed/RefreshedPlayer'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dm" element={<DmRefresh />} />
        <Route path="/play" element={<RefreshedPlayer />} />
        <Route path="/callback" element={<Callback />} />
        {/* legacy aliases from the refresh rollout */}
        <Route path="/dm-refresh" element={<RedirectTo path="/dm" />} />
        <Route path="/refreshed" element={<RedirectTo path="/play" />} />
        <Route path="/lab" element={<RedirectTo path="/play" />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
