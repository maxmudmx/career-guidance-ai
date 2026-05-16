import { useEffect, useMemo, useState } from 'react';
import { predictAPI } from '../services/api';
import { Button, Card, ProgressBar } from '../components/ui';

const LEVELS = [
  { value: 0, label: "Yo'q" },
  { value: 1, label: 'Boshlovchi' },
  { value: 2, label: "O'rta" },
  { value: 3, label: 'Yuqori' },
  { value: 4, label: 'Ekspert' },
];

const FALLBACK_META = {
  interests: [
    { key: 'it', label: 'IT va kompyuter' },
    { key: 'tibbiyot', label: "Tibbiyot va sog'liq" },
    { key: 'muhandislik', label: 'Muhandislik va texnika' },
    { key: 'fan', label: 'Fan va tadqiqot' },
    { key: 'talim', label: "Ta'lim va o'qitish" },
    { key: 'biznes', label: 'Biznes va tadbirkorlik' },
    { key: 'sanat', label: "San'at va ijod" },
    { key: 'sport', label: 'Sport va jismoniy faollik' },
  ],
  subjects: [
    { key: 'matematika', label: 'Matematika' },
    { key: 'fizika', label: 'Fizika' },
    { key: 'kimyo', label: 'Kimyo' },
    { key: 'biologiya', label: 'Biologiya' },
    { key: 'tarix', label: 'Tarix' },
    { key: 'ona_tili', label: 'Ona tili' },
    { key: 'ingliz_tili', label: 'Ingliz tili' },
    { key: 'informatika', label: 'Informatika va dasturlash' },
  ],
  skill_categories: {
    "Asosiy ko'nikmalar": ['Python', 'JavaScript', 'SQL', 'Matematika', 'Kommunikatsiya'],
  },
};

function ChipButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
        active
          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
          : 'border-[#E5E7EB] bg-white text-[#111827] hover:border-[#2563EB]'
      }`}
    >
      {active && '✓ '}
      {children}
    </button>
  );
}

function Slider({ label, value, min, max, step = 1, suffix = '', onChange, leftLabel, rightLabel }) {
  return (
    <div>
      <div className="flex justify-between mb-3">
        <label className="text-[#111827] text-sm">{label}</label>
        <span className="text-lg text-[#2563EB] font-semibold">
          {step < 1 ? Number(value).toFixed(1) : value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
      />
      <div className="flex justify-between mt-2 text-xs text-[#6B7280]">
        <span>{leftLabel ?? min}</span>
        <span>{rightLabel ?? max}</span>
      </div>
    </div>
  );
}

function SkillLevelRow({ skill, level, onChange }) {
  return (
    <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
      <span className="md:w-40 text-sm text-[#111827] font-medium">{skill}</span>
      <div className="flex-1 flex gap-2 min-w-0">
        {LEVELS.slice(1).map((lvl) => (
          <button
            key={lvl.value}
            type="button"
            onClick={() => onChange(level === lvl.value ? 0 : lvl.value)}
            className={`flex-1 py-2 px-2 rounded-lg border text-xs transition-colors ${
              level === lvl.value
                ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#2563EB]'
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AcademicSkills({ onComplete, onBack }) {
  const [meta, setMeta] = useState(FALLBACK_META);
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Akademik
  const [age, setAge] = useState(20);
  const [gpa, setGpa] = useState(3.5);
  const [analytical, setAnalytical] = useState(5);
  const [communication, setCommunication] = useState(5);

  // Qiziqishlar va fanlar
  const [interests, setInterests] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Skills: { skill: level (0..4) }
  const [skillLevels, setSkillLevels] = useState({});
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    predictAPI
      .getMetadata()
      .then((res) => {
        if (!cancelled) setMeta(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleInterest = (key) =>
    setInterests((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  const toggleSubject = (key) =>
    setSubjects((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));

  const setSkillLevel = (skill, lvl) => {
    setSkillLevels((prev) => {
      const next = { ...prev };
      if (lvl <= 0) delete next[skill];
      else next[skill] = lvl;
      return next;
    });
  };

  const filteredCategories = useMemo(() => {
    const cats = meta.skill_categories || {};
    const q = skillFilter.trim().toLowerCase();
    if (!q) return cats;
    const out = {};
    for (const [cat, skills] of Object.entries(cats)) {
      const filtered = skills.filter((s) => s.toLowerCase().includes(q));
      if (filtered.length > 0) out[cat] = filtered;
    }
    return out;
  }, [meta.skill_categories, skillFilter]);

  const selectedSkills = useMemo(
    () => Object.keys(skillLevels).filter((s) => skillLevels[s] > 0),
    [skillLevels],
  );

  const canProceed = () => {
    if (step === 2) return interests.length > 0;
    if (step === 3) return subjects.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onComplete({
        gpa,
        analyticalThinking: analytical,
        communication,
        skills: selectedSkills,
        age,
        interests,
        subjects,
        skill_levels: skillLevels,
      });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-12 font-sans">
      <div className="max-w-4xl mx-auto">
        <ProgressBar current={step} total={totalSteps} className="mb-8" />

        <Card className="p-8">
          {/* Step 1 — Akademik */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl text-[#111827] font-semibold mb-2">
                Akademik ma'lumotlar
              </h2>
              <p className="text-[#4B5563] mb-8">
                Yoshingiz va akademik ko'rsatkichlaringiz haqida ma'lumot bering
              </p>

              <div className="space-y-8">
                <Slider
                  label="Yosh"
                  value={age}
                  min={10}
                  max={80}
                  suffix=" yosh"
                  onChange={setAge}
                  leftLabel="10"
                  rightLabel="80"
                />
                <Slider
                  label="GPA / O'rtacha ball"
                  value={gpa}
                  min={0}
                  max={5}
                  step={0.1}
                  onChange={setGpa}
                  leftLabel="0"
                  rightLabel="5"
                />
                <Slider
                  label="Mantiqiy fikrlash"
                  value={analytical}
                  min={1}
                  max={10}
                  suffix="/10"
                  onChange={setAnalytical}
                  leftLabel="Zaif"
                  rightLabel="Kuchli"
                />
                <Slider
                  label="Muloqot qobiliyati"
                  value={communication}
                  min={1}
                  max={10}
                  suffix="/10"
                  onChange={setCommunication}
                  leftLabel="Zaif"
                  rightLabel="Kuchli"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Qiziqishlar */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl text-[#111827] font-semibold mb-2">
                Qiziqishlaringiz
              </h2>
              <p className="text-[#4B5563] mb-8">
                Sizni qaysi sohalar qiziqtiradi? (kamida bittasini tanlang)
              </p>

              <div className="flex flex-wrap gap-2">
                {(meta.interests || []).map((it) => (
                  <ChipButton
                    key={it.key}
                    active={interests.includes(it.key)}
                    onClick={() => toggleInterest(it.key)}
                  >
                    {it.label}
                  </ChipButton>
                ))}
              </div>

              <div className="mt-6 text-sm text-[#6B7280]">
                Tanlangan: <strong className="text-[#111827]">{interests.length}</strong>
              </div>
            </div>
          )}

          {/* Step 3 — Fanlar */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl text-[#111827] font-semibold mb-2">
                Yoqtirgan fanlaringiz
              </h2>
              <p className="text-[#4B5563] mb-8">
                Maktab/universitetda yoqtirgan fanlaringizni tanlang
              </p>

              <div className="flex flex-wrap gap-2">
                {(meta.subjects || []).map((s) => (
                  <ChipButton
                    key={s.key}
                    active={subjects.includes(s.key)}
                    onClick={() => toggleSubject(s.key)}
                  >
                    {s.label}
                  </ChipButton>
                ))}
              </div>

              <div className="mt-6 text-sm text-[#6B7280]">
                Tanlangan: <strong className="text-[#111827]">{subjects.length}</strong>
              </div>
            </div>
          )}

          {/* Step 4 — Ko'nikmalar */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl text-[#111827] font-semibold mb-2">
                Ko'nikmalaringiz
              </h2>
              <p className="text-[#4B5563] mb-6">
                Bilgan ko'nikmalaringizni tanlang va darajasini belgilang
              </p>

              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Ko'nikma qidirish (Python, SQL, ...)"
                  value={skillFilter}
                  onChange={(e) => setSkillFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg
                    focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]
                    transition-colors text-[#111827] placeholder:text-[#9CA3AF]"
                />
              </div>

              {/* Tanlangan ko'nikmalar */}
              {selectedSkills.length > 0 && (
                <div className="mb-6 p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg">
                  <div className="text-xs font-semibold text-[#1E40AF] mb-3 tracking-wide">
                    TANLANGAN KO'NIKMALAR ({selectedSkills.length})
                  </div>
                  <div className="space-y-2">
                    {selectedSkills.map((skill) => (
                      <div key={skill} className="bg-white rounded-lg p-2">
                        <SkillLevelRow
                          skill={skill}
                          level={skillLevels[skill]}
                          onChange={(lvl) => setSkillLevel(skill, lvl)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kategoriyalar */}
              <div className="space-y-6">
                {Object.entries(filteredCategories).map(([catName, skills]) => (
                  <div key={catName}>
                    <h3 className="text-xs font-semibold text-[#6B7280] mb-3 uppercase tracking-wide">
                      {catName} ({skills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => {
                        const lvl = skillLevels[skill] || 0;
                        const isSelected = lvl > 0;
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => setSkillLevel(skill, isSelected ? 0 : 2)}
                            title={isSelected ? `Daraja: ${LEVELS[lvl].label}` : 'Tanlash'}
                            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                              isSelected
                                ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                                : 'border-[#E5E7EB] bg-white text-[#111827] hover:border-[#2563EB]'
                            }`}
                          >
                            {isSelected && '✓ '}
                            {skill}
                            {isSelected && (
                              <span className="ml-1.5 text-xs opacity-75">
                                · {LEVELS[lvl].label}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {Object.keys(filteredCategories).length === 0 && (
                  <div className="text-center py-8 text-sm text-[#9CA3AF]">
                    "{skillFilter}" bo'yicha ko'nikma topilmadi
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10 pt-6 border-t border-[#E5E7EB]">
            <Button variant="ghost" onClick={handlePrev}>
              {step === 1 ? 'RIASEC testga' : 'Orqaga'}
            </Button>

            <Button variant="primary" onClick={handleNext} disabled={!canProceed()}>
              {step === totalSteps ? 'Tahlilni boshlash' : 'Davom etish'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
