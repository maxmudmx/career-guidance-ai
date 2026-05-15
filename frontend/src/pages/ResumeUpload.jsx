import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Card, Tag } from '../components/ui';

export default function ResumeUpload({ selectedCareer }) {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setError(null);
      setResult(null);
    } else {
      setError('Faqat PDF fayllar qabul qilinadi');
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const occupationId = selectedCareer.id ?? 0;
      const response = await fetch(`/api/resume/analyze?occupation_id=${occupationId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Xatolik yuz berdi');
      }

      const data = await response.json();
      if (data.warning) setError(data.warning);
      setResult(data);
    } catch (err) {
      setError(err.message || "Server bilan bog'lanishda xatolik");
      setResult({
        file_name: file.name,
        occupation: selectedCareer.name_uz || selectedCareer.nameUz,
        keywords: {
          programming: ['python', 'javascript'],
          frameworks: ['react'],
          databases: ['sql'],
        },
        match_analysis: {
          match_percent: 42,
          matched_skills: ['Python', 'SQL'],
          missing_skills: (
            selectedCareer.required_skills ||
            selectedCareer.requiredSkills ||
            []
          ).filter((s) => !['Python', 'SQL'].includes(s)),
        },
        demo: true,
      });
      setError(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      {!result && (
        <Card className="p-8">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-[#7C3AED]" />
            <h3 className="text-lg text-[#111827] font-semibold">Rezume Analizatori</h3>
          </div>
          <p className="text-sm text-[#4B5563] mb-6">
            PDF rezumengizni yuklang — tizim kalit so'zlarni ajratib,{' '}
            <strong className="text-[#111827]">
              {selectedCareer.name_uz || selectedCareer.nameUz}
            </strong>{' '}
            kasbiga mosligini tahlil qiladi
          </p>

          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-10 text-center cursor-pointer hover:border-[#2563EB] transition-colors"
          >
            <input
              type="file"
              accept=".pdf"
              ref={inputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto mb-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg flex items-center justify-center">
              <Upload className="w-7 h-7 text-[#2563EB]" />
            </div>
            {file ? (
              <p className="text-sm font-medium text-[#111827]">{file.name}</p>
            ) : (
              <p className="text-sm text-[#111827]">PDF faylni tanlang yoki shu yerga tashlang</p>
            )}
            <p className="text-xs text-[#6B7280] mt-2">Maksimal 5 MB · faqat PDF</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="mt-4">
            <Button
              variant="primary"
              onClick={handleAnalyze}
              disabled={!file || analyzing}
              className="w-full"
            >
              {analyzing ? 'Tahlil qilinmoqda...' : 'Rezumeni tahlil qilish'}
            </Button>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {result.demo && (
            <Card className="p-4 border-[#FDE68A] bg-[#FFFBEB]">
              <div className="flex items-center gap-2 text-sm text-[#D97706]">
                <AlertCircle className="w-4 h-4" />
                Backend ulangan emas — demo natija ko'rsatilmoqda
              </div>
            </Card>
          )}

          {/* Match score */}
          <Card className="p-8">
            <div className="text-center mb-5">
              <div className="text-5xl text-[#111827] font-semibold mb-2">
                {result.match_analysis?.match_percent ?? 0}%
              </div>
              <p className="text-sm text-[#4B5563]">
                {selectedCareer.name_uz || selectedCareer.nameUz} kasbiga moslik
              </p>
            </div>
            <div className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
                style={{ width: `${result.match_analysis?.match_percent ?? 0}%` }}
              />
            </div>
          </Card>

          {/* Keywords */}
          {result.keywords && Object.keys(result.keywords).length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-lg text-[#111827] font-semibold">
                  Topilgan kalit so'zlar
                </h3>
              </div>
              {Object.entries(result.keywords).map(([cat, words]) => (
                <div key={cat} className="mb-3 last:mb-0">
                  <div className="text-xs font-semibold text-[#6B7280] mb-1.5 uppercase tracking-wide">
                    {cat}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {words.map((w) => (
                      <Tag key={w} variant="primary">
                        {w}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Matched / Missing */}
          {result.match_analysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-[#16A34A]" />
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Mos ko'nikmalar ({result.match_analysis.matched_skills?.length || 0})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.match_analysis.matched_skills || []).map((s) => (
                    <Tag key={s} variant="success">
                      {s}
                    </Tag>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-[#D97706]" />
                  <h3 className="text-sm font-semibold text-[#111827]">
                    Yetishmaydi ({result.match_analysis.missing_skills?.length || 0})
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.match_analysis.missing_skills || []).map((s) => (
                    <Tag key={s} variant="warning">
                      {s}
                    </Tag>
                  ))}
                </div>
              </Card>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleReset}>
              <FileText className="w-4 h-4" /> Yangi rezume yuklash
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
