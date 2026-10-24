import { useSeo } from '../hooks/useSeo'
import HomeHero from '../components/sections/HomeHero'
import ServicesGrid from '../components/sections/ServicesGrid'
import Advantages from '../components/sections/Advantages'
import ProcessTabs from '../components/sections/ProcessTabs'
import Results from '../components/sections/Results'
import LeadCapture from '../components/sections/LeadCapture'
import { getHomeContent } from '../data/content'
import { useLang, useUi } from '../lib/i18n'

export default function Home() {
  const lang = useLang()
  const t = useUi()
  const home = getHomeContent(lang)

  useSeo({ title: t.seoTitle, description: t.seoDescription, path: '/' })

  return (
    <>
      <HomeHero />
      <ServicesGrid />
      <Advantages service={{ accent: home.accent, advantagesLead: home.advantagesLead, advantages: home.advantages }} />
      <ProcessTabs service={{ accent: home.accent, processLead: home.processLead, process: home.process }} />
      <Results service={{ accent: home.accent, stats: home.stats, quote: home.quote }} />
      <LeadCapture title={t.leadTitle} text={t.leadText} />
    </>
  )
}
