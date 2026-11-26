import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { trackClicks } from './lib/analytics'
import { captureAttribution } from './lib/attribution'
import Layout from './components/layout/Layout'
import CustomCursor from './components/ui/CustomCursor'
import Home from './pages/Home'
import ServicePage from './pages/ServicePage'
import PrivacyRoute from './pages/PrivacyRoute'
import Cabinet from './pages/Cabinet'
import Offer from './pages/Offer'
import OfferEn from './pages/OfferEn'
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
          <Route path="/offer" element={<Offer />} />
          <Route path="/en/offer" element={<OfferEn />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/en/cabinet" element={<Cabinet lang="en" />} />
          <Route path="/en/:slug" element={<ServicePage />} />
          <Route path="/:slug" element={<ServicePage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
