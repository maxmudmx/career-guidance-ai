import { useState, useEffect } from 'react';
import {
  X, CheckCircle, XCircle, AlertCircle, ChevronRight,
  Award, RotateCcw, Loader2, Sparkles, TrendingUp, Star,
} from 'lucide-react';
import { Button, Card } from './ui';
import { progressAPI } from '../services/api';

// Daraja ranglari va ikonalari
const LEVEL_META = {
  expert:       { color: '#9333EA', icon: Sparkles, label: 'Mutaxassis' },
  advanced:     { color: '#16A34A', icon: Award,    label: 'Yuqori daraja' },
  intermediate: { color: '#2563EB', icon: TrendingUp, label: "O'rta daraja" },
  beginner:     { color: '#F59E0B', icon: Star,     label: 'Yangi boshlovchi' },
};

/**
 * Ko'nikmani haqiqiy o'zlashtirganini tekshirish uchun mini-quiz.
 *
 * Props:
 *   open          — modal ochiq/yopiq
 *   skill         — ko'nikma nomi (string)
 *   occupationId  — saqlash uchun (number)
 *   onClose       — yopish
 *   onCompleted   — quiz tugaganda chaqiriladi (skill, score, level bilan)
 */
export default function SkillQuizModal({ open, skill, occupationId, onClose, onCompleted }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);

  // Quizni yuklash
  useEffect(() => {
    if (!open || !skill) return;
    let mounted = true;
    setLoading(true);
    setError('');
    setResult(null);
    setCurrentIdx(0);

    progressAPI
      .getSkillQuiz(skill)
      .then((res) => {
        if (!mounted) return;
        setQuestions(res.data.questions || []);
        setAnswers(new Array(res.data.questions?.length || 0).fill(null));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.detail || 'Quiz topilmadi');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [open, skill]);

  if (!open) return null;

  const selectAnswer = (idx) => {
    const next = [...answers];
    next[currentIdx] = idx;
    setAnswers(next);
  };

  const isLast = currentIdx === questions.length - 1;
  const allAnswered = answers.every((a) => a !== null);

  const submit = async () => {
    if (!allAnswered) {
      setError("Hamma savolga javob bering");
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await progressAPI.submitSkillQuiz(skill, answers, occupationId);
      setResult(res.data);
      if (onCompleted) {
        onCompleted(skill, res.data.percent, res.data.level);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Xato yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setAnswers(new Array(questions.length).fill(null));
    setResult(null);
    setCurrentIdx(0);
    setError('');
  };

  const question = questions[currentIdx];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <Card
        className="w-full max-w-xl p-0 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              Ko'nikma tekshiruvi
            </div>
            <h3 className="text-lg font-bold truncate" style={{ color: 'var(--text)' }}>
              {skill}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="text-center py-10">
              <Loader2
                className="w-8 h-8 mx-auto animate-spin"
                style={{ color: 'var(--accent)' }}
              />
              <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                Quiz yuklanmoqda...
              </p>
            </div>
          )}

          {!loading && error && !result && (
            <div
              className="p-4 rounded-lg border flex items-start gap-2 text-sm"
              style={{
                background: 'var(--error-bg)',
                borderColor: 'var(--error-border)',
                color: 'var(--error)',
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Result view — daraja asosida */}
          {result && (() => {
            const meta = LEVEL_META[result.level] || LEVEL_META.beginner;
            const LevelIcon = meta.icon;
            return (
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                  style={{ background: `${meta.color}1F` }}
                >
                  <LevelIcon className="w-8 h-8" style={{ color: meta.color }} />
                </div>

                <div
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ background: `${meta.color}1F`, color: meta.color }}
                >
                  Sizning darajangiz
                </div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: meta.color }}>
                  {result.level_uz || meta.label}
                </h3>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <div
                    className="px-4 py-2 rounded-full text-sm font-bold tabular-nums"
                    style={{ background: 'var(--surface-subtle)', color: 'var(--text)' }}
                  >
                    {result.percent}%
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {result.score}/{result.total} to'g'ri
                  </div>
                </div>

                <p className="text-sm mb-5 max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
                  {result.percent >= 70
                    ? "Bu ko'nikma maqsadingiz progresiga qo'shildi va kasb tavsiyasiga ta'sir qiladi."
                    : result.percent >= 40
                    ? "Profilingizga qo'shildi. Daraja oshishi uchun ko'proq mashq qiling va qaytadan urinib ko'ring."
                    : "Bilim darajangiz pastroq. Profilga qo'shilmadi — Maqsadim sahifasida o'rganish manbalari mavjud."}
                </p>

                {/* Tafsilotlar */}
                <div className="text-left space-y-2 mb-4">
                  {result.details?.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm p-2.5 rounded-lg"
                      style={{ background: d.correct ? 'var(--success-bg)' : 'var(--error-bg)' }}
                    >
                      {d.correct ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                      ) : (
                        <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-xs font-semibold mb-0.5"
                          style={{ color: d.correct ? 'var(--success)' : 'var(--error)' }}
                        >
                          Savol {i + 1}: {d.correct ? "To'g'ri" : "Noto'g'ri"}
                        </div>
                        {!d.correct && questions[i] && (
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            To'g'ri javob: <strong>{questions[i].options[d.right_answer]}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 justify-center flex-wrap">
                  <Button variant="secondary" onClick={retry}>
                    <RotateCcw className="w-4 h-4" /> Qayta urinish
                  </Button>
                  <Button variant="primary" onClick={onClose}>
                    Tugatish
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Quiz view */}
          {!loading && !result && question && (
            <>
              {/* Progress bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  <span>Savol {currentIdx + 1} / {questions.length}</span>
                  <span>{answers.filter((a) => a !== null).length} javob berildi</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((currentIdx + 1) / questions.length) * 100}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
              </div>

              {/* Question */}
              <h4
                className="text-base font-semibold mb-5 leading-relaxed"
                style={{ color: 'var(--text)' }}
              >
                {question.q}
              </h4>

              {/* Options */}
              <div className="space-y-2">
                {question.options.map((opt, i) => {
                  const selected = answers[currentIdx] === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => selectAnswer(i)}
                      className="w-full text-left p-3.5 rounded-lg border transition-colors flex items-start gap-3"
                      style={{
                        background: selected ? 'var(--accent-soft)' : 'var(--surface)',
                        borderColor: selected ? 'var(--accent)' : 'var(--border)',
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold"
                        style={{
                          background: selected ? 'var(--accent)' : 'transparent',
                          borderColor: selected ? 'var(--accent)' : 'var(--border-strong)',
                          color: selected ? '#FFFFFF' : 'var(--text-muted)',
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div
                        className="text-sm leading-relaxed flex-1"
                        style={{ color: selected ? 'var(--accent)' : 'var(--text)' }}
                      >
                        {opt}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div
                  className="mt-4 p-3 rounded-lg border text-sm"
                  style={{
                    background: 'var(--error-bg)',
                    borderColor: 'var(--error-border)',
                    color: 'var(--error)',
                  }}
                >
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !result && questions.length > 0 && (
          <div
            className="flex items-center justify-between gap-3 p-4 border-t flex-wrap"
            style={{ borderColor: 'var(--border)' }}
          >
            <Button
              variant="ghost"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
            >
              Orqaga
            </Button>

            {!isLast ? (
              <Button
                variant="primary"
                onClick={() => setCurrentIdx((i) => i + 1)}
                disabled={answers[currentIdx] === null}
              >
                Keyingi <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={submit}
                disabled={!allAnswered || submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Topshirish
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
