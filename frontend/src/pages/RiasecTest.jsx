import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '../components/ui';

const QUESTIONS = [
  // R - Realistik
  { id: 1, category: 'R', text: "Men asbob-uskunalar bilan ishlashni yoqtiraman" },
  { id: 2, category: 'R', text: "Qo'lim bilan biror narsa yasash menga zavq beradi" },
  { id: 3, category: 'R', text: 'Texnik muammolarni hal qilish menga qiziq' },
  { id: 4, category: 'R', text: "Kompyuter qurilmalarini yig'ish/ta'mirlash men uchun qiziqarli" },
  { id: 5, category: 'R', text: "Men amaliy, qo'lga ko'rinadigan natijalarni afzal ko'raman" },
  // I - Tadqiqotchi
  { id: 6, category: 'I', text: 'Men ilmiy maqolalar oqishni yoqtiraman' },
  { id: 7, category: 'I', text: 'Murakkab masalalarni yechish menga qiziq' },
  { id: 8, category: 'I', text: 'Men narsalarning ichki tuzilishini tushunishga intilaman' },
  { id: 9, category: 'I', text: 'Tadqiqot va tahlil qilish menga yoqadi' },
  { id: 10, category: 'I', text: 'Mantiqiy fikrlash mening kuchli tomonim' },
  // A - Ijodkor
  { id: 11, category: 'A', text: 'Ijodiy loyihalar menga ilhom beradi' },
  { id: 12, category: 'A', text: "Men o'zimni badiiy tomondan ifoda etishni yoqtiraman" },
  { id: 13, category: 'A', text: 'Dizayn va estetika menga muhim' },
  { id: 14, category: 'A', text: "Men yangi g'oyalar yaratishda faolman" },
  { id: 15, category: 'A', text: "Musiqa, san'at yoki yozuv bilan shug'ullanaman" },
  // S - Ijtimoiy
  { id: 16, category: 'S', text: 'Odamlarga yordam berish menga zavq beradi' },
  { id: 17, category: 'S', text: "Men jamoada ishlashni afzal ko'raman" },
  { id: 18, category: 'S', text: "Boshqalarni o'qitish yoki maslahat berish menga yoqadi" },
  { id: 19, category: 'S', text: 'Muloqot qilish mening kuchli tomonim' },
  { id: 20, category: 'S', text: 'Men boshqalarning muammolarini hal qilishga tayyor' },
  // E - Tadbirkor
  { id: 21, category: 'E', text: 'Men rahbarlik qilishni yoqtiraman' },
  { id: 22, category: 'E', text: 'Biznes va tadbirkorlik menga qiziq' },
  { id: 23, category: 'E', text: 'Men boshqalarni ishontira olaman' },
  { id: 24, category: 'E', text: "Qaror qabul qilishda tashabbuskor bo'laman" },
  { id: 25, category: 'E', text: 'Raqobat va muvaffaqiyat menga motivatsiya beradi' },
  // C - Konvensional
  { id: 26, category: 'C', text: "Tartibli va tizimli ishlashni afzal ko'raman" },
  { id: 27, category: 'C', text: "Ma'lumotlarni tartibga solish menga yoqadi" },
  { id: 28, category: 'C', text: 'Men qoidalarga rioya qilishni muhim deb bilaman' },
  { id: 29, category: 'C', text: "Detallarga e'tibor berish mening kuchli tomonim" },
  { id: 30, category: 'C', text: "Aniq ko'rsatmalar bo'yicha ishlash menga qulay" },
];

const CATEGORIES = {
  R: { name: 'Realistik', color: '#DC2626', desc: 'Amaliy va texnik ishlar' },
  I: { name: 'Tadqiqotchi', color: '#2563EB', desc: 'Ilm va tahlil' },
  A: { name: 'Ijodkor', color: '#7C3AED', desc: "San'at va ijod" },
  S: { name: 'Ijtimoiy', color: '#16A34A', desc: 'Odamlar bilan ishlash' },
  E: { name: 'Tadbirkor', color: '#F59E0B', desc: 'Biznes va rahbarlik' },
  C: { name: 'Konvensional', color: '#0891B2', desc: 'Tizimli ishlar' },
};

const LIKERT = [
  { value: 1, label: "Umuman yo'q" },
  { value: 2, label: 'Kam' },
  { value: 3, label: "O'rtacha" },
  { value: 4, label: "Ko'p" },
  { value: 5, label: "Juda ko'p" },
];

function calculateScores(answers) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  QUESTIONS.forEach((q) => {
    if (answers[q.id] !== undefined) {
      scores[q.category] += answers[q.id];
    }
  });
  Object.keys(scores).forEach((k) => {
    scores[k] = Math.round((scores[k] / 25) * 10 * 10) / 10;
  });
  return scores;
}

export default function RiasecTest({ onComplete, onBack }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [showTransition, setShowTransition] = useState(false);

  const question = QUESTIONS[currentQ];
  const total = QUESTIONS.length;
  const category = CATEGORIES[question.category];
  const percentage = ((currentQ + 1) / total) * 100;

  const currentSection = Math.floor(currentQ / 5);
  const nextSection = Math.floor((currentQ + 1) / 5);
  const isSectionEnd = currentSection !== nextSection && currentQ < total - 1;

  // Har kategoriya bo'yicha javoblar holati
  const categoryStatus = Object.keys(CATEGORIES).map((cat) => {
    const catQuestions = QUESTIONS.filter((q) => q.category === cat);
    const answered = catQuestions.filter((q) => answers[q.id] !== undefined).length;
    return {
      key: cat,
      total: catQuestions.length,
      answered,
      completed: answered === catQuestions.length,
    };
  });

  const goNext = useCallback(() => {
    setCountdown(null);
    if (currentQ < total - 1) {
      if (isSectionEnd) {
        setShowTransition(true);
        setTimeout(() => {
          setShowTransition(false);
          setCurrentQ((q) => q + 1);
        }, 1800);
      } else {
        setCurrentQ((q) => q + 1);
      }
    } else {
      const scores = calculateScores(answers);
      onComplete(scores);
    }
  }, [currentQ, total, isSectionEnd, answers, onComplete]);

  const handleAnswer = (val) => {
    setAnswers((a) => ({ ...a, [question.id]: val }));
    setCountdown(3);
  };

  // Auto-advance countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      goNext();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, goNext]);

  // Klaviatura 1-5 — javob; agar javob berilgan bo'lsa Enter — keyingi
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '1' && e.key <= '5') {
        handleAnswer(parseInt(e.key, 10));
      } else if (e.key === 'Enter' && answers[question.id] !== undefined) {
        goNext();
      } else if (e.key === 'Escape' && countdown !== null) {
        setCountdown(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [question.id, answers, goNext, countdown]);

  // Section transition ekrani
  if (showTransition) {
    const nextCat = CATEGORIES[QUESTIONS[currentQ + 1].category];
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6 font-sans">
        <div className="text-center">
          <h2 className="text-2xl text-[#111827] mb-2 font-semibold">
            {category.name} bo'limi tugadi
          </h2>
          <p className="text-[#4B5563]">
            Endi {nextCat.desc.toLowerCase()}ni o'rganamiz
          </p>
        </div>
      </div>
    );
  }

  const answered = answers[question.id] !== undefined;

  return (
    <div className="min-h-screen bg-white pb-12 font-sans">
      {/* Sticky progress header */}
      <div className="border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#4B5563]">
              Savol {currentQ + 1}/{total}
            </span>
            <span className="text-sm text-[#2563EB]">{Math.round(percentage)}%</span>
          </div>
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-[#2563EB] rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* 6 ta kategoriya nuqtasi */}
          <div className="flex items-center justify-center gap-2">
            {categoryStatus.map((cat) => {
              const info = CATEGORIES[cat.key];
              const isActive = question.category === cat.key;
              const cls = cat.completed
                ? 'bg-[#16A34A] border-[#16A34A] text-white'
                : isActive
                ? 'border-[#2563EB] text-[#2563EB] bg-white'
                : 'border-[#E5E7EB] text-[#9CA3AF] bg-white';
              return (
                <div
                  key={cat.key}
                  title={info.name}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${cls}`}
                >
                  {cat.completed ? '✓' : cat.key}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question card */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        {onBack && currentQ === 0 && (
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              Bosh sahifaga
            </Button>
          </div>
        )}

        <Card className="p-8">
          {/* Category badge */}
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <div
              className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-2"
              style={{ borderColor: category.color, color: category.color }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: category.color }}
              />
              <span>{category.name}</span>
            </div>
            <span className="text-sm text-[#6B7280]">{category.desc}</span>
          </div>

          {/* Question text */}
          <div className="mb-8">
            <div className="text-xs text-[#9CA3AF] mb-2 font-medium">Q{question.id}</div>
            <h2 className="text-xl md:text-2xl text-[#111827] leading-relaxed">
              {question.text}
            </h2>
          </div>

          {/* Likert options */}
          <div className="space-y-3 mb-6">
            {LIKERT.map((opt) => {
              const isSelected = answers[question.id] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#2563EB] bg-[#EFF6FF]'
                      : 'border-[#E5E7EB] hover:border-[#2563EB]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                        isSelected
                          ? 'bg-[#2563EB] text-white border border-[#2563EB]'
                          : 'bg-[#F9FAFB] border border-[#E5E7EB] text-[#4B5563]'
                      }`}
                    >
                      {opt.value}
                    </div>
                    <span className="text-[#111827]">{opt.label}</span>
                  </div>
                  {isSelected && <span className="text-[#2563EB] text-lg">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Auto-advance countdown */}
          {countdown !== null && (
            <div className="flex items-center justify-between p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg mb-6">
              <span className="text-sm text-[#4B5563]">
                Keyingi savolga {countdown} soniyada...
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCountdown(null)}>
                Bekor qilish
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            {currentQ > 0 ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setCountdown(null);
                  setCurrentQ((q) => q - 1);
                }}
              >
                Orqaga
              </Button>
            ) : (
              <div />
            )}

            <Button variant="primary" onClick={goNext} disabled={!answered}>
              {currentQ === total - 1 ? 'Tugatish' : 'Keyingisi'}
            </Button>
          </div>

          {/* Keyboard hint */}
          <div className="mt-6 pt-6 border-t border-[#E5E7EB]">
            <div className="text-sm text-[#9CA3AF]">
              Klaviatura: 1–5 raqamlar — javob, Enter — keyingisi
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
