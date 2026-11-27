import { Navigate, useParams } from 'react-router-dom'
import { getServiceBySlug } from '../data/content'
import { localePath, useLang } from '../lib/i18n'
import { useSeo } from '../hooks/useSeo'
import ServiceHero from '../components/sections/ServiceHero'
import AiServices from '../components/sections/AiServices'
import ProducingGallery from '../components/sections/ProducingGallery'
import Pricing from '../components/sections/Pricing'
import Advantages from '../components/sections/Advantages'
import ProcessTabs from '../components/sections/ProcessTabs'
import AiImplementation from '../components/sections/AiImplementation'
import Results from '../components/sections/Results'
import LeadCapture from '../components/sections/LeadCapture'
import CatalogSection from '../components/sections/CatalogSection'

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
      {service.offers && service.offers.length > 0 && <ProducingGallery service={service} />}
      {service.pricing && <Pricing service={service} />}
      <Advantages service={service} />
      <ProcessTabs service={service} />
      {service.aiBlock && <AiImplementation service={service} />}
      <Results service={service} />
      <CatalogSection page={service.slug} />
      <LeadCapture service={service} />
    </>
  )
}
