import { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '../components/ui';
import { useTranslation } from '../contexts/LanguageContext';

// Savol ID -> kategoriya. Matn t('riasec.q.{id}') orqali tarjima qilinadi.
const QUESTIONS = [
  { id: 1, category: 'R' }, { id: 2, category: 'R' }, { id: 3, category: 'R' },
  { id: 4, category: 'R' }, { id: 5, category: 'R' },
  { id: 6, category: 'I' }, { id: 7, category: 'I' }, { id: 8, category: 'I' },
  { id: 9, category: 'I' }, { id: 10, category: 'I' },
  { id: 11, category: 'A' }, { id: 12, category: 'A' }, { id: 13, category: 'A' },
  { id: 14, category: 'A' }, { id: 15, category: 'A' },
  { id: 16, category: 'S' }, { id: 17, category: 'S' }, { id: 18, category: 'S' },
  { id: 19, category: 'S' }, { id: 20, category: 'S' },
  { id: 21, category: 'E' }, { id: 22, category: 'E' }, { id: 23, category: 'E' },
  { id: 24, category: 'E' }, { id: 25, category: 'E' },
  { id: 26, category: 'C' }, { id: 27, category: 'C' }, { id: 28, category: 'C' },
  { id: 29, category: 'C' }, { id: 30, category: 'C' },
];

const CATEGORY_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];
const LIKERT_VALUES = [1, 2, 3, 4, 5];

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
  const { t } = useTranslation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [countdown, setCountdown] = useState(null);
  const [showTransition, setShowTransition] = useState(false);

  const getCategory = (key) => ({
    name: t(`riasec.cat.${key}.name`),
    desc: t(`riasec.cat.${key}.desc`),
    color: 'var(--text)',
  });
  const LIKERT = LIKERT_VALUES.map((v) => ({ value: v, label: t(`riasec.likert.${v}`) }));

  const question = QUESTIONS[currentQ];
  const total = QUESTIONS.length;
  const category = getCategory(question.category);
  const percentage = ((currentQ + 1) / total) * 100;

  const currentSection = Math.floor(currentQ / 5);
  const nextSection = Math.floor((currentQ + 1) / 5);
  const isSectionEnd = currentSection !== nextSection && currentQ < total - 1;

  // Har kategoriya bo'yicha javoblar holati
  const categoryStatus = CATEGORY_KEYS.map((cat) => {
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
    const nextCat = getCategory(QUESTIONS[currentQ + 1].category);
    return (
      <div className="min-h-screen flex items-center justify-center px-6 font-sans" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <h2 className="text-2xl mb-2 font-semibold" style={{ color: 'var(--text)' }}>
            {t('riasec.section_done').replace('{cat}', category.name)}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {t('riasec.next_section').replace('{next}', nextCat.desc.toLowerCase())}
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
                ? 'bg-[#16A34A] border-[#16A34A]'
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
              {t('riasec.btn.back_to_home')}
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
            <div className="text-xs mb-2 font-medium" style={{ color: 'var(--text-faint)' }}>
              {t('riasec.q_label').replace('{n}', question.id)}
            </div>
            <h2 className="text-xl md:text-2xl leading-relaxed" style={{ color: 'var(--text)' }}>
              {t(`riasec.q.${question.id}`)}
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
            <div
              className="flex items-center justify-between p-3 rounded-lg mb-6 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {t('riasec.countdown').replace('{sec}', countdown)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setCountdown(null)}>
                {t('riasec.cancel_countdown')}
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
                {t('riasec.btn.back')}
              </Button>
            ) : (
              <div />
            )}

            <Button variant="primary" onClick={goNext} disabled={!answered}>
              {currentQ === total - 1 ? t('riasec.btn.finish') : t('riasec.btn.next')}
            </Button>
          </div>

          {/* Keyboard hint */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-sm" style={{ color: 'var(--text-faint)' }}>
              {t('riasec.keyboard_hint')}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
