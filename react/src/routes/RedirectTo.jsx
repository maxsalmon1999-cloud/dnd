// Old bookmarks (/lab?char=…, /refreshed, /dm-refresh) → canonical routes,
// keeping the query string (players' ?char= links must survive).
import { Navigate, useLocation } from 'react-router-dom'

export default function RedirectTo({ path }) {
  const { search } = useLocation()
  return <Navigate to={path + search} replace />
}
