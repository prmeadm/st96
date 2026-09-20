import { useEffect } from 'react'
import HomeHero from '../components/sections/HomeHero'
import ServicesGrid from '../components/sections/ServicesGrid'
import Advantages from '../components/sections/Advantages'
import ProcessTabs from '../components/sections/ProcessTabs'
import Results from '../components/sections/Results'
import LeadCapture from '../components/sections/LeadCapture'
import {
  studioAccent,
  studioAdvantages,
  studioAdvantagesLead,
  studioProcess,
  studioProcessLead,
  studioQuote,
  studioStats,
} from '../data/home'

export default function Home() {
  useEffect(() => {
    document.title = 'ST96 — креативная студия полного цикла'
  }, [])

  return (
    <>
      <HomeHero />
      <ServicesGrid />
      <Advantages
        service={{ accent: studioAccent, advantagesLead: studioAdvantagesLead, advantages: studioAdvantages }}
      />
      <ProcessTabs service={{ accent: studioAccent, processLead: studioProcessLead, process: studioProcess }} />
      <Results service={{ accent: studioAccent, stats: studioStats, quote: studioQuote }} />
      <LeadCapture
        title="Готовы обсудить ваш проект?"
        text="Расскажите о задаче — подберём нужные направления и вернёмся с планом в течение дня."
      />
    </>
  )
}
