import { Card } from '../components/ui';
import { useTranslation } from '../contexts/LanguageContext';

const EMAIL = 'elmurodovmaxmud8@gmail.com';
const PHONE = '+998 90 009 14 47';
const TELEGRAM = 'https://t.me/makhmud_1920';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          {t('contact.title')}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          {t('contact.subtitle')}
        </p>

        <Card className="mb-3">
          <ContactRow
            label={t('contact.email')}
            value={EMAIL}
            href={`mailto:${EMAIL}`}
          />
          <ContactRow
            label={t('contact.phone')}
            value={PHONE}
            href={`tel:${PHONE.replace(/\s/g, '')}`}
          />
          <ContactRow
            label={t('contact.telegram')}
            value="@makhmud_1920"
            href={TELEGRAM}
            external
          />
          <ContactRow
            label={t('contact.location')}
            value={t('contact.location_value')}
            isLast
          />
        </Card>

        <Card>
          <div className="px-5 py-4">
            <div className="text-xs uppercase font-semibold mb-2" style={{ color: 'var(--text-faint)' }}>
              {t('contact.developer')}
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>
              {t('contact.developer_name')}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('contact.developer_role')}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}


function ContactRow({ label, value, href, external, isLast }) {
  const content = (
    <div
      className={`px-5 py-4 ${!isLast ? 'border-b' : ''}`}
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-base" style={{ color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block transition-opacity hover:opacity-70"
      style={{ textDecoration: 'none' }}
    >
      {content}
    </a>
  );
}
