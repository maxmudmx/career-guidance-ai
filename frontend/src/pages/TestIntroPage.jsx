import { Button, Card } from '../components/ui';
import { useTranslation } from '../contexts/LanguageContext';

export default function TestIntroPage({ onStart }) {
  const { t } = useTranslation();
  const STEPS = [
    { n: '1', title: t('test_intro.step1.title'), desc: t('test_intro.step1.desc') },
    { n: '2', title: t('test_intro.step2.title'), desc: t('test_intro.step2.desc') },
    { n: '3', title: t('test_intro.step3.title'), desc: t('test_intro.step3.desc') },
  ];
  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            {t('test_intro.title')}
          </h1>
          <p
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('test_intro.subtitle')}
          </p>

        </div>

        <Card className="p-5 mb-6">
          <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text)' }}>
            {t('test_intro.steps_title')}
          </h2>
          <div className="space-y-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                  }}
                >
                  {s.n}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {s.title}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button variant="primary" size="lg" onClick={onStart} className="w-full">
          {t('test_intro.btn.continue')}
        </Button>
      </div>
    </div>
  );
}
