import { useState } from 'react';
import { GraduationCap, Zap, ArrowRight } from 'lucide-react';
import styles from './AcademicSkills.module.css';

const ALL_SKILLS = [
  'Python', 'JavaScript', 'SQL', 'HTML/CSS', 'React', 'Git',
  'Matematika', 'Statistika', 'Machine Learning', 'Docker',
  'Linux', 'Figma', 'Dizayn', 'Kommunikatsiya', 'Boshqaruv',
  'Agile', 'Data Visualization', 'API Design', 'System Design',
  'Kriptografiya', 'Tarmoq xavfsizligi', 'TensorFlow', 'NLP',
];

export default function AcademicSkills({ onComplete }) {
  const [gpa, setGpa] = useState(3.5);
  const [analytical, setAnalytical] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [favSubjects, setFavSubjects] = useState('');

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = () => {
    onComplete({
      gpa,
      analyticalThinking: analytical,
      communication,
      favSubjects,
      skills: selectedSkills,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ma'lumotlaringiz</h2>
        <p className={styles.subtitle}>
          Akademik ko'rsatkichlar va mavjud ko'nikmalaringizni kiriting
        </p>
      </div>

      {/* Academic Card */}
      <div className={`${styles.card} animate-in animate-in-delay-1`}>
        <h3 className={styles.cardTitle}>
          <GraduationCap size={20} color="var(--accent)" />
          Akademik ma'lumotlar
        </h3>

        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>GPA (0-5)</label>
            <input
              type="range" min="0" max="5" step="0.1" value={gpa}
              onChange={(e) => setGpa(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.sliderValue}>{gpa.toFixed(1)}</span>
          </div>
          <div>
            <label className={styles.label}>Yoqtirgan fanlar</label>
            <input
              type="text"
              placeholder="Matematika, Fizika, Informatika..."
              value={favSubjects}
              onChange={(e) => setFavSubjects(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.grid2} style={{ marginTop: 20 }}>
          <div>
            <label className={styles.label}>
              Analitik fikrlash: <strong style={{ color: 'var(--accent)' }}>{analytical}/10</strong>
            </label>
            <input
              type="range" min="1" max="10" value={analytical}
              onChange={(e) => setAnalytical(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
          <div>
            <label className={styles.label}>
              Muloqotchilik: <strong style={{ color: 'var(--accent)' }}>{communication}/10</strong>
            </label>
            <input
              type="range" min="1" max="10" value={communication}
              onChange={(e) => setCommunication(Number(e.target.value))}
              className={styles.slider}
            />
          </div>
        </div>
      </div>

      {/* Skills Card */}
      <div className={`${styles.card} animate-in animate-in-delay-2`}>
        <h3 className={styles.cardTitle}>
          <Zap size={20} color="var(--accent-alt)" />
          Mavjud ko'nikmalaringiz
        </h3>
        <p className={styles.cardMeta}>
          Bilgan ko'nikmalaringizni tanlang (bir nechta tanlashingiz mumkin)
        </p>
        <div className={styles.skillsGrid}>
          {ALL_SKILLS.map((skill) => {
            const sel = selectedSkills.includes(skill);
            return (
              <button
                key={skill}
                className={`${styles.skillChip} ${sel ? styles.skillSelected : ''}`}
                onClick={() => toggleSkill(skill)}
              >
                {sel && '✓ '}
                {skill}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.submitWrap}>
        <button className={styles.submitBtn} onClick={handleSubmit}>
          <ArrowRight size={20} />
          Natijalarni ko'rish
        </button>
      </div>
    </div>
  );
}
