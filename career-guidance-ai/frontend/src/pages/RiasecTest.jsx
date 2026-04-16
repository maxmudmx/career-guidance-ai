import { useState } from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import styles from './RiasecTest.module.css';

const QUESTIONS = [
  { id: 1, text: "Men asbob-uskunalar bilan ishlashni yoqtiraman", category: "R" },
  { id: 2, text: "Qo'lim bilan biror narsa yasash menga zavq beradi", category: "R" },
  { id: 3, text: "Texnik muammolarni hal qilish menga qiziq", category: "R" },
  { id: 4, text: "Kompyuter qurilmalarini yig'ish/ta'mirlash men uchun qiziqarli", category: "R" },
  { id: 5, text: "Men amaliy, qo'lga ko'rinadigan natijalarni afzal ko'raman", category: "R" },
  { id: 6, text: "Men ilmiy maqolalar o'qishni yoqtiraman", category: "I" },
  { id: 7, text: "Murakkab masalalarni yechish menga qiziq", category: "I" },
  { id: 8, text: "Men narsalarning ichki tuzilishini tushunishga intilaman", category: "I" },
  { id: 9, text: "Tadqiqot va tahlil qilish menga yoqadi", category: "I" },
  { id: 10, text: "Mantiqiy fikrlash mening kuchli tomonim", category: "I" },
  { id: 11, text: "Ijodiy loyihalar menga ilhom beradi", category: "A" },
  { id: 12, text: "Men o'zimni badiiy tomondan ifoda etishni yoqtiraman", category: "A" },
  { id: 13, text: "Dizayn va estetika menga muhim", category: "A" },
  { id: 14, text: "Men yangi g'oyalar yaratishda faolman", category: "A" },
  { id: 15, text: "Musiqa, san'at yoki yozuv bilan shug'ullanaman", category: "A" },
  { id: 16, text: "Odamlarga yordam berish menga zavq beradi", category: "S" },
  { id: 17, text: "Men jamoada ishlashni afzal ko'raman", category: "S" },
  { id: 18, text: "Boshqalarni o'qitish yoki maslahat berish menga yoqadi", category: "S" },
  { id: 19, text: "Muloqot qilish mening kuchli tomonim", category: "S" },
  { id: 20, text: "Men boshqalarning muammolarini hal qilishga tayyor", category: "S" },
  { id: 21, text: "Men rahbarlik qilishni yoqtiraman", category: "E" },
  { id: 22, text: "Biznes va tadbirkorlik menga qiziq", category: "E" },
  { id: 23, text: "Men boshqalarni ishontira olaman", category: "E" },
  { id: 24, text: "Qaror qabul qilishda tashabbuskor bo'laman", category: "E" },
  { id: 25, text: "Raqobat va muvaffaqiyat menga motivatsiya beradi", category: "E" },
  { id: 26, text: "Tartibli va tizimli ishlashni afzal ko'raman", category: "C" },
  { id: 27, text: "Ma'lumotlarni tartibga solish menga yoqadi", category: "C" },
  { id: 28, text: "Men qoidalarga rioya qilishni muhim deb bilaman", category: "C" },
  { id: 29, text: "Detallarga e'tibor berish mening kuchli tomonim", category: "C" },
  { id: 30, text: "Aniq ko'rsatmalar bo'yicha ishlash menga qulay", category: "C" },
];

const CATEGORY_LABELS = {
  R: 'Realistik', I: 'Tadqiqotchi', A: 'Ijodkor',
  S: 'Ijtimoiy', E: 'Tadbirkor', C: 'Konvensional',
};

const SCORE_LABELS = ['Umuman yo\'q', 'Kam', "O'rtacha", "Ko'p", 'Juda ko\'p'];

export default function RiasecTest({ onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = QUESTIONS[currentQ];
  const answered = answers[q?.id] !== undefined;
  const progress = ((Object.keys(answers).length) / QUESTIONS.length) * 100;

  const handleAnswer = (val) => {
    const newAnswers = { ...answers, [q.id]: val };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentQ(currentQ + 1), 250);
    } else {
      // Skorlarni hisoblash
      const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      QUESTIONS.forEach((question) => {
        if (newAnswers[question.id] !== undefined) {
          scores[question.category] += newAnswers[question.id];
        }
      });
      // 0-10 ga normallash
      Object.keys(scores).forEach((k) => {
        scores[k] = Math.round((scores[k] / 25) * 10 * 10) / 10;
      });
      setTimeout(() => onComplete(scores), 300);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Progress */}
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>
            Savol {currentQ + 1} / {QUESTIONS.length}
          </span>
          <span className={styles.progressPercent}>{Math.round(progress)}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>

        {/* Category badge */}
        <div className={styles.categoryBadge} data-cat={q.category}>
          {CATEGORY_LABELS[q.category]}
        </div>

        {/* Question */}
        <h2 className={styles.question}>{q.text}</h2>

        {/* Answer buttons */}
        <div className={styles.options}>
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              className={`${styles.optionBtn} ${answers[q.id] === val ? styles.selected : ''}`}
              onClick={() => handleAnswer(val)}
            >
              <span className={styles.optionNum}>{val}</span>
              <span className={styles.optionLabel}>{SCORE_LABELS[val - 1]}</span>
            </button>
          ))}
        </div>

        {/* Back button */}
        {currentQ > 0 && (
          <button className={styles.backBtn} onClick={() => setCurrentQ(currentQ - 1)}>
            <ChevronLeft size={18} />
            Ortga
          </button>
        )}
      </div>
    </div>
  );
}
