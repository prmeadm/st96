import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getService } from '../data/services'
import ServiceHero from '../components/sections/ServiceHero'
import Advantages from '../components/sections/Advantages'
import ProcessTabs from '../components/sections/ProcessTabs'
import Results from '../components/sections/Results'
import LeadCapture from '../components/sections/LeadCapture'

export default function ServicePage() {
  const { slug } = useParams()
  const service = getService(slug ?? '')

  useEffect(() => {
    if (service) document.title = `${service.navLabel} — ST96`
  }, [service])

  if (!service) return <Navigate to="/" replace />

  return (
    <>
      <ServiceHero service={service} />
      <Advantages service={service} />
      <ProcessTabs service={service} />
      <Results service={service} />
      <LeadCapture service={service} />
    </>
  )
}
