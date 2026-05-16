import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui';
import { statsAPI } from '../services/api';

const STEPS = [
  { step: '01', title: 'Test topshiring', desc: '30 ta RIASEC savoliga javob bering' },
  { step: '02', title: "Ma'lumot kiriting", desc: "Akademik va ko'nikmalaringizni baholang" },
  { step: '03', title: 'AI tahlil', desc: 'Eng mos kasblarni tanlaydi' },
  { step: '04', title: 'Natija oling', desc: "To'liq yo'l xaritasi va tavsiyalar" },
];

const BENEFITS = [
  'RIASEC psixometrik test asosida',
  'Machine Learning aniqligi 91%+',
  'Batafsil skill gap tahlili',
  "6 oylik o'quv yo'l xaritasi",
  'Real vakansiyalar bilan integratsiya',
];

// ────────────────────────────────────────────────────────────
// Tashqi dunyo statistikalari (real manbalardan)
// ────────────────────────────────────────────────────────────
const PROBLEM_STATS = [
  {
    value: 65,
    suffix: '%',
    label: "yoshlar tanlagan kasbidan pushaymon",
    desc: "FlexJobs (2023) tadqiqotiga ko'ra, har 3 ta yoshdan 2 tasi tanlagan ish yo'lidan afsuslangan",
    color: '#EF4444',
  },
  {
    value: 13.6,
    suffix: '%',
    label: "global yoshlar ishsizligi",
    desc: "ILO 2024: 15-24 yoshdagilar orasida ishsizlik darajasi 3 baravar ko'p kattalardan",
    color: '#F59E0B',
  },
  {
    value: 23,
    suffix: '%',
    label: "yoshlar NEET — ne ish, ne o'qish",
    desc: "Jahon Banki: yoshlarning chorak qismi ne ishlaydi, ne o'qiydi — boshi berk ko'chada",
    color: '#DC2626',
  },
  {
    value: 7,
    suffix: ' yil',
    label: "noto'g'ri kasb uchun sarflangan",
    desc: "O'rtacha bitiruvchi 5-7 yilni boshqa sohaga o'tib qayta o'rganishga sarflaydi",
    color: '#7C3AED',
  },
];

const CONSEQUENCES = [
  {
    title: "Ruhiy salomatlik inqirozi",
    desc: "WHO: kasbsiz yoshlarda depressiya 2.5×, suiсid xavfi 40% yuqori. O'z-o'zini topa olmaslik — eng katta sabablardan biri.",
  },
  {
    title: "Jinoyatchilik o'sishi",
    desc: "BMT tadqiqoti: ishsiz yoshlarda jinoyatga aralashish ehtimoli 3-5 baravar yuqori. Boshi berk ko'cha — eng xavfli yo'l.",
  },
  {
    title: "Bekor ketgan ta'lim",
    desc: "O'zbekistonda bitiruvchilarning ~60%i ixtisosiga mos ishlamaydi. Ota-ona pul, talaba 4-5 yil — bekor.",
  },
  {
    title: "Kasb almashtirish qiyinchiligi",
    desc: "30 yoshdan keyin kasb o'zgartirish 5× qiyinroq — vaqt, oila, moliya bog'lanib qoladi.",
  },
];

// ────────────────────────────────────────────────────────────
// Animatsiyali sanagich (one-shot, 0 → target)
// ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const startedFor = useRef(null);

  useEffect(() => {
    if (target == null) return;
    if (startedFor.current === target) return;
    startedFor.current = target;

    const start = performance.now();
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const isFloat = target % 1 !== 0;
      const v = target * eased;
      setValue(isFloat ? Math.round(v * 10) / 10 : Math.round(v));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function AppStatCard({ value, label, color = 'var(--accent)', showLive = false }) {
  const n = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div
      className="p-5 rounded-xl border relative"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {showLive && (
        <span className="absolute top-4 right-4 flex w-2 h-2">
          <span
            className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
            style={{ background: color }}
          />
          <span
            className="relative inline-flex w-2 h-2 rounded-full"
            style={{ background: color }}
          />
        </span>
      )}
      <div className="text-3xl font-bold font-mono mb-1 tabular-nums" style={{ color }}>
        {n.toLocaleString('en-US')}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

function ProblemStatCard({ value, suffix, label, desc, color }) {
  const n = useCountUp(value);
  return (
    <div
      className="p-6 rounded-xl border relative overflow-hidden"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: color }}
      />
      <div className="text-4xl font-bold font-mono mb-3 mt-2" style={{ color }}>
        {n}{suffix}
      </div>
      <div
        className="text-sm font-semibold mb-2"
        style={{ color: 'var(--text)' }}
      >
        {label}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {desc}
      </p>
    </div>
  );
}

// Pulsing dot
function LiveDot() {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      <span
        className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
        style={{ background: '#22C55E' }}
      />
      <span
        className="relative inline-flex w-2 h-2 rounded-full"
        style={{ background: '#22C55E' }}
      />
    </span>
  );
}

export default function WelcomePage({ onStart }) {
  const [activeNow, setActiveNow] = useState(0);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      statsAPI.getLiveUsers().then(
        (res) => mounted && setActiveNow(res.data?.active_users || 0),
        () => {},
      );
      statsAPI.getOverview().then(
        (res) => mounted && setOverview(res.data),
        () => {},
      );
    };
    load();
    const id = setInterval(load, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const totalUsers = overview?.total_users ?? 0;
  const totalTests = overview?.total_tests ?? 0;
  const testsToday = overview?.tests_today ?? 0;
  const testsThisWeek = overview?.tests_this_week ?? 0;
  const popularCareers = overview?.popular_careers ?? [];
  const topType = overview?.top_dominant_type;

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg)' }}>
      {/* Hero */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 800,
            height: 500,
            background:
              'radial-gradient(ellipse at center, rgba(59,130,246,0.18) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
            }}
          >
            <span style={{ color: 'var(--text)' }}>
              Hozir <strong>{activeNow}</strong> ta foydalanuvchi onlayn
            </span>
          </div>

          <h1
            className="text-5xl md:text-6xl mb-6 leading-[1.1] font-bold"
            style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}
          >
            Kelajak kasbingizni
            <br />
            <span style={{ color: 'var(--accent)' }}>sun'iy intellekt</span> bilan toping
          </h1>

          <p
            className="text-base md:text-lg mb-2 max-w-2xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            Qiziqishlaringiz, ko'nikmalaringiz va akademik natijalaringizni tahlil qilib,
            sizga eng mos kasbni topib beramiz.
          </p>
          <p
            className="text-base max-w-2xl mx-auto leading-relaxed font-medium mb-8"
            style={{ color: 'var(--accent)' }}
          >
            5 daqiqa — butun umringizga to'g'ri yo'nalish.
          </p>

          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            }}
          >
            Testni boshlash
          </button>
        </div>
      </section>

      {/* ILOVA ICHIDAGI STATISTIKA */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}
            >
              Kasbim hamjamiyati
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold mb-2"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              Bizda nima sodir bo'lyapti
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Tizimimizdagi haqiqiy raqamlar — har 30 sekundda yangilanadi
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <AppStatCard value={totalUsers} label="Foydalanuvchilar" color="var(--accent)" />
            <AppStatCard value={activeNow} label="Hozir onlayn" color="#22C55E" showLive />
            <AppStatCard value={totalTests} label="Testlar o'tkazilgan" color="var(--accent)" />
            <AppStatCard value={testsThisWeek} label="Bu hafta testlar" color="#7C3AED" />
          </div>

          {/* Mashhur kasblar va dominant tip */}
          {(popularCareers.length > 0 || topType) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularCareers.slice(0, 3).map((c, i) => {
                const labels = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={c.name}
                    className="p-5 rounded-xl border flex items-center gap-3"
                    style={{
                      background: 'var(--surface)',
                      borderColor: 'var(--border)',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        background: i === 0 ? 'rgba(251,191,36,0.15)' : 'var(--accent-soft)',
                      }}
                    >
                      {labels[i]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-faint)' }}>
                        {i === 0 ? 'Top tanlov' : `#${i + 1} mashhur`}
                      </div>
                      <div
                        className="font-semibold truncate"
                        style={{ color: 'var(--text)' }}
                      >
                        {c.name}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {c.count} kishi tanladi
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {testsToday > 0 && (
            <div
              className="mt-4 p-4 rounded-xl text-center text-sm"
              style={{
                background: 'var(--accent-soft)',
                color: 'var(--text)',
                border: '1px solid var(--accent-border)',
              }}
            >
              ✨ Bugun <strong style={{ color: 'var(--accent)' }}>{testsToday}</strong> ta yosh
              o'z kasb yo'lini topdi — siz keyingisi bo'lishingiz mumkin.
            </div>
          )}
        </div>
      </section>

      {/* MUAMMO — Yoshlar oldidagi haqiqiy statistika */}
      <section
        className="py-20 px-6"
        style={{
          background: 'var(--surface-subtle)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#EF4444',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Bugungi haqiqat
            </div>
            <h2
              className="text-3xl md:text-4xl mb-4 font-bold"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              Yoshlar oldidagi muammo
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Dunyoda har kuni millionlab yoshlar noto'g'ri kasb yo'lini tanlaydi —
              bu hayotning eng katta xatolaridan biri.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {PROBLEM_STATS.map((s, i) => (
              <ProblemStatCard key={i} {...s} />
            ))}
          </div>

          {/* Oqibatlar */}
          <div
            className="p-6 sm:p-8 rounded-2xl border"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="text-center mb-6">
              <h3
                className="text-xl sm:text-2xl mb-2 font-bold"
                style={{ color: 'var(--text)' }}
              >
                Noto'g'ri tanlovning oqibatlari
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Boshi berk ko'cha qaergacha olib boradi
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONSEQUENCES.map((c, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl border flex gap-4"
                  style={{
                    background: 'var(--bg)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="min-w-0">
                    <h4
                      className="text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--text)' }}
                    >
                      {c.title}
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {c.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p
              className="text-xs text-center mt-5 italic"
              style={{ color: 'var(--text-faint)' }}
            >
              Manbalar: ILO, WHO, World Bank, FlexJobs, BMT (2023-2024)
            </p>
          </div>
        </div>
      </section>

      {/* YECHIM — Test = chiqish yo'li */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold"
            style={{
              background: 'rgba(34,197,94,0.12)',
              color: '#22C55E',
              border: '1px solid rgba(34,197,94,0.3)',
            }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Yechim mavjud
          </div>
          <h2
            className="text-3xl md:text-4xl mb-4 font-bold"
            style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
          >
            Boshi berk ko'chaga kirmang
          </h2>
          <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Kasbim — sun'iy intellekt va RIASEC psixologik testlari asosida,
            yoshlarni o'z iste'dodiga mos sohaga yo'naltiruvchi tizim.
            <strong style={{ color: 'var(--text)' }}> 5 daqiqada</strong> butun hayotingiz uchun
            to'g'ri qaror.
          </p>
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section
        className="py-20 px-6"
        style={{
          background: 'var(--surface-subtle)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl mb-3 font-bold"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              Qanday ishlaydi?
            </h2>
            <p className="text-base md:text-lg" style={{ color: 'var(--text-muted)' }}>
              To'rtta oddiy qadam
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-xl flex flex-col gap-4 transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="font-semibold" style={{ color: 'var(--text)', fontSize: 17 }}>
                  {item.title}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {item.desc}
                </p>
                <div
                  className="font-mono text-xs"
                  style={{ color: 'var(--text-faint)' }}
                >
                  {item.step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2
                className="text-3xl mb-6 font-bold"
                style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
              >
                Nima uchun Kasbim?
              </h2>
              <div className="space-y-4">
                {BENEFITS.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: 'var(--success)' }}
                    />
                    <span style={{ color: 'var(--text)' }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-8">
              <div className="text-center mb-6">
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>
                  Ishonchli yondashuv
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div
                    className="text-3xl mb-1 font-bold font-mono"
                    style={{ color: 'var(--accent)' }}
                  >
                    91%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    ML aniqligi
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl mb-1 font-bold font-mono"
                    style={{ color: 'var(--accent)' }}
                  >
                    30
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    RIASEC savol
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl mb-1 font-bold font-mono"
                    style={{ color: 'var(--accent)' }}
                  >
                    270+
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Kasb tahlili
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-3xl mb-1 font-bold font-mono"
                    style={{ color: 'var(--accent)' }}
                  >
                    5
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    daqiqa
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div
          className="max-w-5xl mx-auto text-center text-sm"
          style={{ color: 'var(--text-faint)' }}
        >
          <p>© 2026 Kasbim. AI yordamida kasblarni rivojlantirish.</p>
        </div>
      </footer>
    </div>
  );
}
