import {
  Brain, Target, Sparkles, Clock,
  CheckCircle, AlertCircle, ArrowRight,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { BackButton } from '../components/PageHeader';

const STEPS = [
  {
    n: '1',
    icon: Brain,
    title: 'RIASEC psixometrik test',
    desc: '30 ta savolga 1-5 ball oraliqda javob bering. Bu sizning qiziqish va xarakteringizni aniqlaydi.',
    time: '~3 daqiqa',
  },
  {
    n: '2',
    icon: Target,
    title: "Akademik ma'lumotlar",
    desc: "GPA, yosh, qiziqishlar, fanlardagi natijalaringiz va ko'nikmalaringizni kiriting.",
    time: '~2 daqiqa',
  },
  {
    n: '3',
    icon: Sparkles,
    title: 'AI tahlil va natija',
    desc: '270+ kasb orasidan sizga eng mos top 3 ta kasb va 6 oylik o\'quv yo\'l xaritasi.',
    time: 'Avtomatik',
  },
];

const RULES = [
  "Har bir savolga sidqidildan javob bering — \"to'g'ri\" yoki \"noto'g'ri\" javob yo'q.",
  "Birinchi xayolingizga kelgan javobni tanlang, uzoq o'ylamang.",
  "Natijalar saqlanadi va istalgan vaqt profilingizdan ko'rishingiz mumkin.",
  "Testni qayta o'tkazib, taqqoslash mumkin.",
];

export default function TestIntroPage({ onStart, onBack }) {
  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <div className="mb-6">
          <BackButton onClick={onBack} />
        </div>

        {/* Hero */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent-soft)' }}
          >
            <Brain className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-2"
            style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            Kasb tanlash testi
          </h1>
          <p
            className="text-sm sm:text-base max-w-md mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            Sizga eng mos IT kasblarni topish uchun bir necha bosqichda javob beriladi.
          </p>

          <div
            className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              color: 'var(--accent)',
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            Umumiy: ~5 daqiqa
          </div>
        </div>

        {/* Steps */}
        <Card className="p-5 mb-6">
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: 'var(--text)' }}
          >
            Test bosqichlari
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {s.title}
                    </h3>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      {s.time}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rules */}
        <Card className="p-5 mb-6">
          <h2
            className="text-base font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--text)' }}
          >
            <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            Qoidalar
          </h2>
          <ul className="space-y-2.5">
            {RULES.map((rule, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <CheckCircle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: 'var(--success)' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>{rule}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Continue */}
        <Button variant="primary" size="lg" onClick={onStart} className="w-full">
          Davom etish
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
