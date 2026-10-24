import { useLang } from '../lib/i18n'
import PrivacyRu from './Privacy'
import PrivacyEn from './PrivacyEn'

export default function PrivacyRoute() {
  return useLang() === 'en' ? <PrivacyEn /> : <PrivacyRu />
}
