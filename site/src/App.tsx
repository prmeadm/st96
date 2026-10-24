import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { trackClicks } from './lib/analytics'
import { captureAttribution } from './lib/attribution'
import Layout from './components/layout/Layout'
import CustomCursor from './components/ui/CustomCursor'
import Home from './pages/Home'
import ServicePage from './pages/ServicePage'
import PrivacyRoute from './pages/PrivacyRoute'
import CookieBanner from './components/ui/CookieBanner'

function App() {
  useEffect(() => {
    captureAttribution()
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
          <Route path="/privacy" element={<PrivacyRoute />} />
          <Route path="/en" element={<Home />} />
          <Route path="/en/privacy" element={<PrivacyRoute />} />
          <Route path="/en/:slug" element={<ServicePage />} />
          <Route path="/:slug" element={<ServicePage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
