import { Navigate, useParams } from 'react-router-dom'
import { getService } from '../data/services'
import { useSeo } from '../hooks/useSeo'
import ServiceHero from '../components/sections/ServiceHero'
import Advantages from '../components/sections/Advantages'
import ProcessTabs from '../components/sections/ProcessTabs'
import Results from '../components/sections/Results'
import LeadCapture from '../components/sections/LeadCapture'

export default function ServicePage() {
  const { slug } = useParams()
  const service = getService(slug ?? '')

  useSeo({
    title: service ? `${service.navLabel} — ST96` : 'ST96',
    description: service?.tagline ?? '',
    path: `/${slug ?? ''}`,
  })

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
