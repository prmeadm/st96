import { Navigate, useParams } from 'react-router-dom'
import { getServiceBySlug } from '../data/content'
import { localePath, useLang } from '../lib/i18n'
import { useSeo } from '../hooks/useSeo'
import ServiceHero from '../components/sections/ServiceHero'
import AiServices from '../components/sections/AiServices'
import Advantages from '../components/sections/Advantages'
import ProcessTabs from '../components/sections/ProcessTabs'
import Results from '../components/sections/Results'
import LeadCapture from '../components/sections/LeadCapture'

export default function ServicePage() {
  const { slug } = useParams()
  const lang = useLang()
  const service = getServiceBySlug(lang, slug ?? '')

  useSeo({
    title: service ? `${service.navLabel} — ST96` : 'ST96',
    description: service?.tagline ?? '',
    path: `/${slug ?? ''}`,
  })

  if (!service) return <Navigate to={localePath(lang, '/')} replace />

  return (
    <>
      <ServiceHero service={service} />
      {service.slug === 'ai' && <AiServices />}
      <Advantages service={service} />
      <ProcessTabs service={service} />
      <Results service={service} />
      <LeadCapture service={service} />
    </>
  )
}
