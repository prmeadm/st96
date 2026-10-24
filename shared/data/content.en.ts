import type { Advantage, ProcessStep, Service, Stat } from './services'

type ServiceText = Pick<
  Service,
  | 'navLabel'
  | 'kicker'
  | 'title'
  | 'tagline'
  | 'heroNote'
  | 'keywords'
  | 'advantagesLead'
  | 'advantages'
  | 'processLead'
  | 'process'
  | 'stats'
  | 'quote'
  | 'ctaTitle'
  | 'ctaText'
>

export const servicesEn: Record<string, ServiceText> = {
  producing: {
    navLabel: 'Producing',
    kicker: 'Project producing',
    title: ['We turn an idea', 'into a project', 'that pays off'],
    tagline:
      'We take on the entire path of a creative project — from meaning and concept to release and first revenue. Artists, media projects, collaborations, shows.',
    heroNote: 'From idea to release — turnkey',
    keywords: ['Strategy', 'Casting', 'Budget', 'Team', 'Release', 'Monetization'],
    advantagesLead:
      'Producing is not "help with an idea" — it is systematic, result-driven work at every stage.',
    advantages: [
      {
        title: 'Full management cycle',
        text: 'We handle strategy, budget, team and timelines — you control the meaning, we control the process.',
      },
      {
        title: 'The right people at the right time',
        text: 'We assemble a team for the task from a proven pool: directors, artists, authors, venues, contractors.',
      },
      {
        title: 'Packaged for the market',
        text: 'We shape a product that investors, partners and audiences understand from the very first presentation.',
      },
      {
        title: 'Monetization from day one',
        text: "We calculate the project's unit economics before production starts, not after the budget is spent.",
      },
    ],
    processLead: 'How a producing project works',
    process: [
      {
        step: '01',
        title: 'Diagnostics and concept',
        text: 'We break the idea down to its essence: audience, value, what sets it apart. We shape the concept and positioning.',
        points: ['Market and competitor analysis', 'Defining the core of the project', 'Potential and risk assessment'],
      },
      {
        step: '02',
        title: 'Production plan',
        text: 'We build a roadmap: stages, budget, team, monetization points, key dates.',
        points: ['Budget and funding structure', 'Schedule', 'Monetization model'],
      },
      {
        step: '03',
        title: 'Team assembly and launch',
        text: 'We bring in the right specialists, start production and personally oversee every stage.',
        points: ['Team and partner selection', 'Production management', 'Quality and deadline control'],
      },
      {
        step: '04',
        title: 'Release and promotion',
        text: 'We bring the project to its audience together with the promotion team — from announcement to first results.',
        points: ['Release strategy', 'Sync with the promo campaign', 'Post-analytics and next step'],
      },
    ],
    stats: [
      { value: '40', suffix: '+', label: 'projects delivered' },
      { value: '96', suffix: '%', label: 'projects delivered on time' },
      { value: '12', suffix: ' yrs', label: 'team experience in the industry' },
    ],
    quote: {
      text: "ST96 didn't just \"help with an idea\" — they built a process that investors believed in.",
      author: 'Founder of a media project',
    },
    ctaTitle: 'Have an idea that needs a producer?',
    ctaText: "Tell us about your project — in 30 minutes we'll review its potential and give you an honest assessment.",
  },
  promotion: {
    navLabel: 'Commercial promotion',
    kicker: 'Commercial promotion',
    title: ['We promote so that', 'it shows', 'in the numbers'],
    tagline:
      'We build promo campaigns that move business metrics, not just reach. Strategy, creative and media buying — in one pair of hands.',
    heroNote: 'Promotion tied to sales',
    keywords: ['Reach', 'Conversion', 'Creative', 'Media plan', 'ROI', 'Audience'],
    advantagesLead:
      "Promotion for reach alone looks nice but doesn't pay off. We count every ruble in the media plan.",
    advantages: [
      {
        title: 'Strategy built from the business goal',
        text: 'We start not with creative but with the number you need: sales, leads, awareness, repeat purchases.',
      },
      {
        title: 'Multichannel reach',
        text: 'Digital, outdoor, influencers, event promo, retail marketing — we build a media mix for your audience, not from a template.',
      },
      {
        title: 'Creative that sells',
        text: 'Every idea is tested with the question "why would anyone buy this" — before it goes into production.',
      },
      {
        title: 'Transparent analytics',
        text: 'Weekly dashboards per channel: what worked, what we switch off, where we move the budget.',
      },
    ],
    processLead: 'How a promo campaign is built',
    process: [
      {
        step: '01',
        title: 'Audit and goals',
        text: 'We study your business, audience and competitors. We set a measurable campaign goal.',
        points: ['Analysis of current channels', 'Audience profile', 'Campaign KPIs'],
      },
      {
        step: '02',
        title: 'Strategy and media plan',
        text: 'We assemble the mix of channels, messages and budget with a forecast of reach and cost per result.',
        points: ['Media mix and budgeting', 'Key messages', 'Flight calendar'],
      },
      {
        step: '03',
        title: 'Production and launch',
        text: 'We make the creative in-house — no outside contractors and no loss of quality control.',
        points: ['Creative concepts', 'Production of materials', 'Channel setup and launch'],
      },
      {
        step: '04',
        title: 'Optimization and reporting',
        text: 'We run the campaign in real time and shift budget toward what works.',
        points: ['Weekly analytics', 'A/B tests of creatives', 'Final ROI report'],
      },
    ],
    stats: [
      { value: '3.4', suffix: 'x', label: 'average ROMI growth for clients' },
      { value: '85', suffix: '+', label: 'campaigns launched' },
      { value: '15', suffix: 'M+', label: 'reach over the past year' },
    ],
    quote: {
      text: 'For the first time, marketing stopped being "costs" and became a line that brings in money.',
      author: 'Marketing director, retail',
    },
    ctaTitle: 'Want promotion that is counted in money?',
    ctaText: "Send us a brief — we'll build a media plan with a result forecast in 3 days.",
  },
  production: {
    navLabel: 'Production',
    kicker: 'Production',
    title: ['We shoot what', 'stops the', 'scroll'],
    tagline:
      'Video, photo and content, full cycle: script, shooting, editing, graphics. One team — from brief to final file.',
    heroNote: 'Full-cycle content production',
    keywords: ['Script', 'Lighting', 'Editing', 'Graphics', 'Sound', 'Color grading'],
    advantagesLead:
      'Production is more than a camera. It is script, lighting, editing and deadline discipline in one place.',
    advantages: [
      {
        title: 'In-house team and equipment',
        text: 'Directors, camera operators, editors and motion designers on staff — no "we will gather freelancers for the project".',
      },
      {
        title: 'From idea to final file',
        text: 'Script, storyboard, shooting, editing, color grading, graphics and sound — one managed process.',
      },
      {
        title: 'Any format and scale',
        text: 'Commercials, series, music videos, product shoots, event content — we adapt the process to the task.',
      },
      {
        title: 'Deadlines fixed in the contract',
        text: 'A schedule with checkpoints — you always know what stage the project is at.',
      },
    ],
    processLead: 'How production works',
    process: [
      {
        step: '01',
        title: 'Pre-production',
        text: 'Script, storyboard, casting, locations and estimate — we fix everything before the first shooting day.',
        points: ['Script and storyboard', 'Casting and locations', 'Estimate and schedule'],
      },
      {
        step: '02',
        title: 'Shooting',
        text: 'We work with our own equipment and team, keeping to the schedule and quality standard on set.',
        points: ['Directing and cinematography', 'Light and sound', 'Footage control'],
      },
      {
        step: '03',
        title: 'Post-production',
        text: 'Editing, color grading, graphics and sound design — we bring the material to final quality.',
        points: ['Editing and color grading', 'Motion graphics and VFX', 'Sound design'],
      },
      {
        step: '04',
        title: 'Adaptation and delivery',
        text: 'We prepare versions for every format and platform you need and deliver with the project source files.',
        points: ['Versions for distribution channels', 'Final delivery of materials', 'Source archive'],
      },
    ],
    stats: [
      { value: '250', suffix: '+', label: 'projects in the portfolio' },
      { value: '48', suffix: ' h', label: 'average time to a first draft' },
      { value: '98', suffix: '%', label: 'of clients come back' },
    ],
    quote: {
      text: "We haven't seen this speed and editing quality from any other production team.",
      author: 'Brand manager, FMCG',
    },
    ctaTitle: 'Need production you can rely on?',
    ctaText: "Describe the task — we'll come back with a concept and estimate within 48 hours.",
  },
  ai: {
    navLabel: 'AI development',
    kicker: 'AI-based development',
    title: ['We build products', 'that think faster', 'than the market'],
    tagline:
      'We design and develop AI-based software: from process automation to your own AI products.',
    heroNote: 'AI solutions from prototype to production',
    keywords: ['Data', 'Model', 'Automation', 'Integration', 'Prototype', 'Scaling'],
    advantagesLead:
      'AI is a tool, not hype. We apply it where it really changes unit economics.',
    advantages: [
      {
        title: 'A product approach, not a "pilot" one',
        text: "We calculate value and ROI at the prototype stage — we don't build demos for the sake of demos.",
      },
      {
        title: 'Full technology stack',
        text: 'LLM integrations, computer vision, automation, custom models and classic backend — whatever the task needs.',
      },
      {
        title: 'Interface design for AI products',
        text: 'UX for AI products is a discipline of its own. We design interfaces that users trust.',
      },
      {
        title: 'Support after launch',
        text: "Model fine-tuning, quality monitoring and scaling — we support the product, we don't hand it over and leave.",
      },
    ],
    processLead: 'How an AI product is built',
    process: [
      {
        step: '01',
        title: 'AI audit and hypotheses',
        text: 'We look for places where AI gives a measurable effect: time, money, quality. We formulate and prioritize hypotheses.',
        points: ['Process and data analysis', 'AI applicability assessment', 'Hypothesis prioritization by ROI'],
      },
      {
        step: '02',
        title: 'Prototype',
        text: 'We build a working prototype on real data to test the hypothesis before full development.',
        points: ['Model and architecture choice', 'MVP on real data', 'Quality metrics'],
      },
      {
        step: '03',
        title: 'Product development',
        text: 'We build the production solution: backend, interfaces, integrations, infrastructure and data security.',
        points: ['Architecture and integrations', 'Interface and UX', 'Testing and security'],
      },
      {
        step: '04',
        title: 'Launch and growth',
        text: 'We deploy to production, watch model metrics and iteratively improve quality and speed.',
        points: ['Deployment and monitoring', 'Model fine-tuning', 'Product development roadmap'],
      },
    ],
    stats: [
      { value: '20', suffix: '+', label: 'AI solutions implemented' },
      { value: '35', suffix: '%', label: 'average cost reduction' },
      { value: '6', suffix: ' wks', label: 'to the first prototype' },
    ],
    quote: {
      text: 'We got not a presentation about AI but a working product that paid for itself within a quarter.',
      author: 'CTO, fintech company',
    },
    ctaTitle: 'Have a process worth automating?',
    ctaText: "Describe the task — we'll run a free AI audit and show where the effect is hidden.",
  },
}

export const homeEn: {
  advantagesLead: string
  advantages: Advantage[]
  processLead: string
  process: ProcessStep[]
  stats: Stat[]
  quote: { text: string; author: string }
} = {
  advantagesLead:
    'Four directions, one team and a single art director per project — instead of a chain of disconnected contractors.',
  advantages: [
    {
      title: 'Full cycle under one roof',
      text: 'From meaning and strategy to the final product — without losing context between contractors.',
    },
    {
      title: 'Creative and technology in one team',
      text: 'Producers, marketers, the production crew and AI engineers work in sync on a single task.',
    },
    {
      title: 'Solutions that are counted in numbers',
      text: 'Every stage is tied to a measurable result — budget, timing, ROI and product metrics.',
    },
    {
      title: 'Flexible scale for the task',
      text: 'From a one-off shoot to full producing of an AI product — we bring exactly the expertise you need.',
    },
  ],
  processLead: 'How working with the studio goes',
  process: [
    {
      step: '01',
      title: 'Brief and diagnostics',
      text: 'We dive into the task, audience and business goals, and define the format of cooperation and the directions needed.',
      points: ['Task and context review', 'Potential and risk assessment', 'Format and team composition'],
    },
    {
      step: '02',
      title: 'Strategy and plan',
      text: 'We assemble a roadmap and a team for the result — from producing and promo to AI development.',
      points: ['Project roadmap', 'Budget and resources', 'Key success metrics'],
    },
    {
      step: '03',
      title: 'Delivery',
      text: 'Production, the promo campaign and development run in parallel and in sync under a single art director.',
      points: ['Unified project management', 'Synchronization of directions', 'Quality and deadline control'],
    },
    {
      step: '04',
      title: 'Result and growth',
      text: 'We deliver the result, measure the effect and propose the next step for scaling.',
      points: ['Delivery and post-analytics', 'Effect measurement', 'Project development plan'],
    },
  ],
  stats: [
    { value: '90', suffix: '+', label: 'projects delivered' },
    { value: '4', label: 'directions under one roof' },
    { value: '96', suffix: '%', label: 'of clients return with a new project' },
  ],
  quote: {
    text: 'ST96 is a rare case where producing, marketing, production and development truly speak the same language.',
    author: 'Managing partner, studio client',
  },
}
