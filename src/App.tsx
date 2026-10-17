import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { trackClicks } from './lib/analytics'
import Layout from './components/layout/Layout'
import CustomCursor from './components/ui/CustomCursor'
import Home from './pages/Home'
import ServicePage from './pages/ServicePage'
import Privacy from './pages/Privacy'
import CookieBanner from './components/ui/CookieBanner'

function App() {
  useEffect(() => {
    document.addEventListener('click', trackClicks)
    return () => document.removeEventListener('click', trackClicks)
  }, [])

  return (
    <>
      <CustomCursor />
      <CookieBanner />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/:slug" element={<ServicePage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
