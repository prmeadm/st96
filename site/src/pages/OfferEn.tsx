import { useSeo } from '../hooks/useSeo'
import Reveal from '../components/ui/Reveal'
import { Section, List } from './Privacy'
import { OPERATOR } from '../../../crm/shared/data/privacy'

const OFFER_DATE_EN = 'November 26, 2026'

export default function OfferEn() {
  useSeo({
    title: 'Service Offer — ST96',
    description: 'Public offer of ' + OPERATOR.short + ' for support and development services (packages and credits) at ' + OPERATOR.site + '.',
    path: '/en/offer',
  })

  return (
    <div className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:px-8 sm:pt-40">
      <Reveal>
        <span className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-acid" />
          Documents
        </span>
        <h1 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-5xl">
          Service Offer
        </h1>
        <p className="mt-5 text-paper-dim">Version of {OFFER_DATE_EN}. This offer is a proposal by {OPERATOR.short} to enter into an agreement for support and development services on the terms below.</p>
      </Reveal>

      <Section n={1} title="Definitions">
        <List items={[
          'Studio (contractor) — ' + OPERATOR.short + ' (Tax ID ' + OPERATOR.unp + '), brand ST96.',
          'Client (customer) — an individual or legal entity that registered in the personal cabinet and accepted this offer.',
          'Package — a monthly volume of ST credits under one of the plans (Basic, Standard, Professional, Ultimate).',
          'Credit — an internal unit of work volume; the credit cost of each task is shown in the cabinet.',
          'Period — 30 calendar days of package validity.',
          'Top-up — purchasing additional credits beyond the package.',
          'Project — an object (website, service, bot) to which the package and credits are attached.',
          'Order — a cabinet order for a package and/or credit top-up.',
        ]} />
      </Section>

      <Section n={2} title="Subject of the offer">
        <p>The contractor provides support, maintenance and development services for the client's projects. A package sets the credit limit per period; a top-up adds credits that do not expire when the period changes.</p>
      </Section>

      <Section n={3} title="Prices and payment">
        <List items={[
          'Prices are listed on the website and in the cabinet in Belarusian rubles (BYN).',
          'Legal entities receive an invoice; individuals pay via a payment link.',
          "Until a payment provider is connected, the moment of payment is the manager's confirmation that funds were received.",
        ]} />
      </Section>

      <Section n={4} title="Credits and spending">
        <List items={[
          'Credits are spent as tasks are completed; the credit cost is shown in the cabinet before confirmation.',
          'Package credits are valid within the period and expire when it ends.',
          'Top-up credits do not expire and carry over when the package changes.',
        ]} />
      </Section>

      <Section n={5} title="Timing and scope">
        <p>The period is 30 calendar days. Tasks are handled in order of the queue. The list of what is not included in support is clarified on request and shown in the cabinet.</p>
      </Section>

      <Section n={6} title="Documents">
        <List items={[
          'Legal entities — an invoice and a service completion act.',
          'Individuals — an invoice (if needed) and an e-receipt.',
          'Documents are generated automatically and appear in the cabinet under Documents.',
        ]} />
      </Section>

      <Section n={7} title="Auto-renewal">
        <List items={[
          'Auto-renewal is enabled by the client in the cabinet.',
          '7 calendar days before the period ends, an order and invoice for the next period are placed in the cabinet.',
          'Auto-renewal can be turned off at any time before the order is placed.',
          'If unpaid, the order is cancelled when the payment deadline expires.',
        ]} />
      </Section>

      <Section n={8} title="Refunds and cancellation">
        <List items={[
          'Before the period is activated, the order can be cancelled and the payment refunded.',
          'After activation, refunds are issued net of services actually rendered.',
          'To request a refund, contact ' + OPERATOR.email + '.',
        ]} />
      </Section>

      <Section n={9} title="Liability and force majeure">
        <p>The parties are released from liability under force majeure circumstances. The contractor's liability is limited to the cost of paid but unrendered services for the current period.</p>
      </Section>

      <Section n={10} title="Personal data">
        <p>The client's personal data is processed in accordance with the <a className="text-acid underline" href="/en/privacy">privacy policy</a>. By registering and placing an order, the client consents to data processing to the extent necessary to provide the services.</p>
      </Section>

      <Section n={11} title="Changes to terms">
        <p>The contractor may amend the offer with notice to clients in the cabinet and an updated version date. Amendments apply to new orders.</p>
      </Section>

      <Section n={12} title="Details and contacts">
        <List items={[
          OPERATOR.name + ' (Tax ID ' + OPERATOR.unp + ')',
          OPERATOR.address,
          'Email: ' + OPERATOR.email,
          'Phone: ' + OPERATOR.phone,
          'Site: ' + OPERATOR.site,
        ]} />
      </Section>
    </div>
  )
}
