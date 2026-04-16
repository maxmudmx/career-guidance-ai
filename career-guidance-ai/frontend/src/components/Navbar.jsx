import { Brain, CheckCircle } from 'lucide-react';
import styles from './Navbar.module.css';

const STEPS = ['Kirish', 'RIASEC Test', "Ma'lumotlar", 'Natijalar'];

export default function Navbar({ currentStep }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>

        {/* ── Logo ─────────────────────────────── */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Brain size={18} color="white" />
          </div>
          <span className={styles.logoText}>
            KasbYo'l<span className={styles.logoAccent}>AI</span>
          </span>
        </div>

        {/* ── Steps ────────────────────────────── */}
        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <div key={i} className={styles.stepGroup}>
              <div className={styles.stepWrap}>
                <div className={[
                  styles.stepCircle,
                  i < currentStep ? styles.done : i === currentStep ? styles.active : '',
                ].join(' ')}>
                  {i < currentStep ? <CheckCircle size={13} /> : i + 1}
                </div>
                <span className={`${styles.stepLabel} ${i === currentStep ? styles.stepLabelActive : ''}`}>
                  {step}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`${styles.stepLine} ${i < currentStep ? styles.lineDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Right spacer (layout balance) ────── */}
        <div style={{ width: 36, flexShrink: 0 }} />

      </div>
    </nav>
  );
}
