import { useState, useEffect } from 'react';
import { Brain, Target, BookOpen, Sparkles, Zap, ChevronRight, BarChart3, Shield } from 'lucide-react';
import styles from './WelcomePage.module.css';

const STATS = [
  { value: 15, suffix: '+', label: "IT kasb yo'nalishlari", icon: Briefcase },
  { value: 91, suffix: '%', label: "ML model aniqligi", icon: BarChart3 },
  { value: 30, suffix: ' ta', label: "RIASEC savollari", icon: Target },
  { value: 6, suffix: ' oy', label: "O'quv rejasi", icon: BookOpen },
];

function Briefcase({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

function AnimatedCounter({ target, suffix, duration = 1500 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}{suffix}</span>;
}

const FEATURES = [
  { icon: Brain, label: 'RIASEC Psixometrik Test', desc: "Holland modeli asosida 30 ta savol" },
  { icon: BarChart3, label: 'ML Bashorat Engine', desc: "RandomForest 91% aniqlik bilan" },
  { icon: Target, label: 'Skills Gap Tahlil', desc: "Ko'nikmalar bo'shliqlarini aniqlash" },
  { icon: BookOpen, label: "6 Oylik Yo'l Xaritasi", desc: "Haftalik batafsil o'quv rejasi" },
  { icon: Zap, label: 'AI Chat Maslahatchi', desc: "Savol-javob va karriyer maslahat" },
  { icon: Shield, label: '15 Ta Kasb Tahlili', desc: "IT sohasining barcha yo'nalishlari" },
];

const CAREERS = [
  { name: "AI/ML Muhandis", salary: "$135K", growth: "+55%", color: "#635BFF" },
  { name: "DevOps Muhandis", salary: "$125K", growth: "+45%", color: "#00D4AA" },
  { name: "Bulut Muhandisi", salary: "$122K", growth: "+42%", color: "#FF6B35" },
  { name: "Data Scientist", salary: "$120K", growth: "+35%", color: "#F59E0B" },
  { name: "Backend Dasturchi", salary: "$110K", growth: "+25%", color: "#10B981" },
];

export default function WelcomePage({ onStart }) {
  const [visible, setVisible] = useState(false);
  const [activeCareer, setActiveCareer] = useState(0);

  useEffect(() => {
    setVisible(true);
    const timer = setInterval(() => setActiveCareer(a => (a + 1) % CAREERS.length), 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.bgOrb1} />
      <div className={styles.bgOrb2} />
      <div className={styles.bgOrb3} />
      <div className={styles.bgOrb4} />

      {/* HERO */}
      <div className={styles.hero}>
        <div className={styles.content} style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
          <div className={styles.badge}>
            <Sparkles size={13} color="#00D4AA" />
            <span>v2.0 · 15 ta kasb · AI Chatbot</span>
          </div>

          <div className={styles.iconBox}>
            <Brain size={44} color="white" />
          </div>

          <h1 className={styles.title}>
            Kasbingizni AI bilan
            <br />
            <span className={styles.gradient}>Aniqlang</span>
          </h1>

          <p className={styles.subtitle}>
            Machine Learning va RIASEC psixometriyasi asosida shaxsiyatingizga,
            ko'nikmalaringiz va qiziqishlaringizga mos IT kasblarni toping.
          </p>

          {/* Animated career ticker */}
          <div className={styles.ticker}>
            <span className={styles.tickerLabel}>Hozir tavsiya:</span>
            <div className={styles.tickerCareer} style={{ borderColor: CAREERS[activeCareer].color }}>
              <span style={{ color: CAREERS[activeCareer].color, fontWeight: 700 }}>
                {CAREERS[activeCareer].name}
              </span>
              <span className={styles.tickerSalary}>{CAREERS[activeCareer].salary}/yil</span>
              <span className={styles.tickerGrowth}>{CAREERS[activeCareer].growth}</span>
            </div>
          </div>

          <div className={styles.btnRow}>
            <button className={styles.startBtn} onClick={onStart}>
              <Sparkles size={18} />
              Testni boshlash
              <ChevronRight size={18} />
            </button>
            <div className={styles.metaRow}>
              <span>~ 5 daqiqa</span>
              <span>·</span>
              <span>30 savol</span>
              <span>·</span>
              <span>Bepul</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {[
            { value: 15, suffix: '+', label: "Kasb yo'nalishlari", color: '#00D4AA' },
            { value: 91, suffix: '%', label: "ML aniqligi", color: '#635BFF' },
            { value: 30, suffix: '', label: "RIASEC savol", color: '#FF6B35' },
            { value: 6, suffix: ' oy', label: "O'quv rejasi", color: '#F59E0B' },
          ].map((s, i) => (
            <div key={i} className={styles.statCard} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
              <div className={styles.statValue} style={{ color: s.color }}>
                {visible && <AnimatedCounter target={s.value} suffix={s.suffix} duration={1200 + i * 200} />}
              </div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tizim imkoniyatlari</h2>
        <p className={styles.sectionSub}>Bir platformada kariyer tahlilining barcha vositalari</p>
        <div className={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <div key={i} className={styles.featureCard} style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={styles.featureIcon}>
                <f.icon size={22} color="white" />
              </div>
              <h3 className={styles.featureLabel}>{f.label}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* IT BOZOR STATISTIKASI */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>IT bozor tendensiyalari 2024</h2>
        <p className={styles.sectionSub}>Eng tez o'suvchi va to'lov qiluvchi yo'nalishlar</p>
        <div className={styles.marketGrid}>
          {CAREERS.map((c, i) => (
            <div key={i} className={styles.marketCard}>
              <div className={styles.marketBar}>
                <div className={styles.marketFill} style={{
                  width: `${parseInt(c.growth)}%`,
                  background: c.color,
                  animationDelay: `${0.2 + i * 0.15}s`,
                }} />
              </div>
              <div className={styles.marketInfo}>
                <span className={styles.marketName}>{c.name}</span>
                <div className={styles.marketMeta}>
                  <span style={{ color: c.color, fontWeight: 700 }}>{c.growth}</span>
                  <span className={styles.marketSalary}>{c.salary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Qanday ishlaydi?</h2>
        <div className={styles.stepsRow}>
          {[
            { num: '01', title: "RIASEC Testni to'ldiring", desc: "30 ta savol, ~5 daqiqa" },
            { num: '02', title: "Ko'nikmalar va akademik ma'lumot", desc: "GPA, texnik ko'nikmalar" },
            { num: '03', title: "AI tahlil qiladi", desc: "ML model 91% aniqlik bilan" },
            { num: '04', title: "Natijalar va yo'l xaritasi", desc: "Top 3 kasb + 6 oylik reja" },
          ].map((s, i) => (
            <div key={i} className={styles.stepItem}>
              <div className={styles.stepNum}>{s.num}</div>
              <div className={styles.stepConnector} style={{ opacity: i < 3 ? 1 : 0 }} />
              <h4 className={styles.stepTitle}>{s.title}</h4>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className={styles.cta}>
        <h2 className={styles.ctaTitle}>Kasbingizni hoziroq aniqlang</h2>
        <p className={styles.ctaSub}>Bepul · 5 daqiqa · Hech qanday ro'yxatdan o'tish shart emas</p>
        <button className={styles.startBtn} onClick={onStart} style={{ margin: '0 auto' }}>
          <Sparkles size={18} />
          Boshlash
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
