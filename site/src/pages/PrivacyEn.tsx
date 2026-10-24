import { useSeo } from '../hooks/useSeo'
import Reveal from '../components/ui/Reveal'
import { OPERATOR, POLICY_DATE_LABEL_EN } from '../../../shared/data/privacy'
import { List, Section } from './Privacy'

export default function PrivacyEn() {
  useSeo({
    title: 'Personal Data Processing Policy — ST96',
    description: `Personal data processing policy of KINGSGARDEN LLC on the ${OPERATOR.site} website.`,
    path: '/privacy',
  })

  return (
    <div className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:px-8 sm:pt-40">
      <Reveal>
        <span className="mb-4 inline-flex items-center gap-2 font-display text-xs font-semibold tracking-[0.2em] text-paper-dim uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-acid" />
          Documents
        </span>
        <h1 className="text-balance font-display text-3xl leading-[1.1] font-semibold sm:text-5xl">
          Personal Data Processing Policy
        </h1>
        <p className="mt-5 text-paper-dim">Version dated {POLICY_DATE_LABEL_EN}</p>
        <p className="mt-3 text-sm text-paper-dim">
          This is a courtesy translation. In case of any discrepancy, the Russian version of the policy prevails.
        </p>
      </Reveal>

      <div className="mt-10">
        <Section n={1} title="General provisions">
          <p>
            This policy sets out the procedure for processing and the measures for protecting the personal
            data of users of the {OPERATOR.site} website (the "website") and has been prepared in accordance
            with the Law of the Republic of Belarus of 7 May 2021 No. 99-Z "On Personal Data Protection"
            (the "Law") and other legislation of the Republic of Belarus.
          </p>
          <p>
            By using the request form on the website and ticking the consent to personal data processing,
            the user confirms that they have read this policy.
          </p>
        </Section>

        <Section n={2} title="Personal data operator">
          <List
            items={[
              'Kingsgarden Limited Liability Company (KINGSGARDEN LLC)',
              `UNP ${OPERATOR.unp}, OKPO ${OPERATOR.okpo}`,
              `Address: ${OPERATOR.address}`,
              `Email: ${OPERATOR.email}`,
              `Phone: ${OPERATOR.phone}`,
            ]}
          />
          <p>
            The website and the studio operate under the {OPERATOR.brand} name. No person has been appointed
            to be responsible for internal control over personal data processing; the operator's functions
            are performed by the management of the organization.
          </p>
        </Section>

        <Section n={3} title="Purposes of processing">
          <List
            items={[
              'contacting the user about the submitted request, clarifying the task and terms of cooperation;',
              'preparing a commercial proposal and a project estimate;',
              'concluding and performing a service agreement, if the parties decide to conclude one;',
              'informing about special offers, new services, promotions and discounts, including by mailings and targeted advertising — based on the user\'s consent (section 5);',
              'analyzing traffic and improving the website (section 10).',
            ]}
          />
        </Section>

        <Section n={4} title="What data is processed">
          <p>Data subjects are website users who fill in the request form. The following is processed:</p>
          <List
            items={[
              'the name provided by the user;',
              'contact details: phone number or email address;',
              'the selected service direction;',
              'the text of the message, if the user leaves one;',
              'information about the source of the visit: UTM tags in the link, entry page and referrer site (for the duration of the session);',
              'the date and time of the request and the fact of consent to this policy.',
            ]}
          />
          <p>
            Special categories of personal data (health, beliefs, biometrics, etc.) are not requested.
            Please do not include them in your message.
          </p>
        </Section>

        <Section n={5} title="Legal basis">
          <p>
            Processing is carried out on the basis of the user's consent, which the user expresses by
            ticking the corresponding box in the request form on the website. The consent is free,
            unambiguous and informed. Without consent the request is not sent through the form; you can
            contact the operator by phone, email or Telegram.
          </p>
          <p>
            The consent covers all purposes listed in section 3, including receiving advertising and the
            transfer of data to third parties for advertising purposes. Consent can be withdrawn at any
            time (section 9).
          </p>
        </Section>

        <Section n={6} title="Retention period">
          <p>
            Data is stored until the purposes of processing are achieved or until the user withdraws
            consent, unless a longer retention period is required to perform a contract or is established
            by law. After that the data is deleted or anonymized.
          </p>
        </Section>

        <Section n={7} title="Transfer of data to third parties">
          <p>
            To receive and process requests the operator uses the Telegram messenger — the request is
            forwarded to the operator's internal chat — as well as technical services (hosting,
            communication services) that keep the website running.
          </p>
          <p>The operator may transfer data to third parties:</p>
          <List
            items={[
              'solely to process the request and prepare the most relevant and advantageous offer for the user;',
              'for advertising purposes — for mailings, targeted and other advertising, and informing about special offers, new services, promotions and discounts.',
            ]}
          />
          <p>
            Some services and third parties may be located outside the Republic of Belarus, including in
            states where an adequate level of protection of data subjects' rights may not be ensured. The
            transfer is carried out only with the user's consent, and the user is warned of this risk.
            Data may also be provided on the grounds and in the manner provided by law.
          </p>
        </Section>

        <Section n={8} title="Protection measures">
          <p>
            The operator takes legal, organizational and technical protection measures: data transmission
            over a secure connection (HTTPS), restricting access to requests to the employees who need
            them, and storing access tokens in protected environment variables.
          </p>
        </Section>

        <Section n={9} title="User rights">
          <p>The user has the right to:</p>
          <List
            items={[
              'obtain information about their personal data and its processing;',
              'demand changes to the data if it is incomplete or inaccurate;',
              'obtain information about the disclosure of their data to third parties;',
              'withdraw consent to processing and demand that processing be stopped and/or the data deleted;',
              'appeal the operator\'s actions to the authorized body — the National Center for Personal Data Protection of the Republic of Belarus (cpd.by) — or to a court.',
            ]}
          />
          <p>
            An application can be sent to {OPERATOR.email} or to the operator's address. The operator
            reviews the request and responds within 15 calendar days. Withdrawal of consent does not
            affect the lawfulness of processing before the withdrawal.
          </p>
        </Section>

        <Section n={10} id="cookies" title="Cookies and analytics">
          <p>
            The website uses cookies and the web analytics services Yandex Metrica (Yandex LLC, Russia)
            and Google Analytics (Google LLC, USA) to analyze traffic and user behavior on the website and
            to improve it. These services may collect technical data: IP address, browser and device
            information, pages visited, and the source of the visit.
          </p>
          <p>Cookies fall into two categories:</p>
          <List
            items={[
              'necessary — keep the website working and remember your cookie choice; always on;',
              'analytics — Google Analytics and Yandex Metrica; enabled only if you give consent in the cookie banner. Until then the analytics services are not launched.',
            ]}
          />
          <p>
            You can change your choice at any time via the "Cookie settings" link at the bottom of the
            website. When consent is withdrawn, analytics cookies are deleted. You can also disable or
            delete cookies in your browser settings; some website functions may then work incorrectly.
            Analytics data is processed in anonymized form and is not linked to requests from the form.
          </p>
        </Section>

        <Section n={11} title="Changes to the policy">
          <p>
            The operator may amend this policy. The current version is always available at{' '}
            {OPERATOR.site}/en/privacy; the date of the version is shown at the top of the page.
          </p>
        </Section>
      </div>
    </div>
  )
}
