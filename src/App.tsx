import { Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import CustomCursor from './components/ui/CustomCursor'
import Home from './pages/Home'
import ServicePage from './pages/ServicePage'

function App() {
  return (
    <>
      <CustomCursor />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:slug" element={<ServicePage />} />
        </Routes>
      </Layout>
    </>
  )
}

export default App
