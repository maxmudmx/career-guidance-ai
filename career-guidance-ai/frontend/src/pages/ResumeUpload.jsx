import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './ResumeUpload.module.css';

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
      setResult(data);
    } catch (err) {
      setError(err.message || 'Server bilan bog\'lanishda xatolik');
      // Fallback: demo natija ko'rsatish
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
          missing_skills: (selectedCareer.required_skills || selectedCareer.requiredSkills || [])
            .filter(s => !['Python', 'SQL'].includes(s)),
        },
        demo: true,
      });
      setError(null);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div>
      {/* Upload Area */}
      <div className={`${styles.card} animate-in`}>
        <h4 className={styles.cardTitle}>
          <FileText size={18} color="var(--accent-alt)" />
          Rezume Analizatori (NLP)
        </h4>
        <p className={styles.cardMeta}>
          PDF rezumengizni yuklang — tizim kalit so'zlarni ajratib,{' '}
          <strong>{selectedCareer.name_uz || selectedCareer.nameUz}</strong> kasbiga mosligini tahlil qiladi
        </p>

        <div
          className={styles.dropzone}
          onClick={() => inputRef.current?.click()}
        >
          <input
            type="file"
            accept=".pdf"
            ref={inputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <Upload size={32} color="var(--accent)" />
          {file ? (
            <p className={styles.fileName}>{file.name}</p>
          ) : (
            <p className={styles.dropText}>PDF faylni tanlang yoki shu yerga tashlang</p>
          )}
          <span className={styles.dropHint}>Maks. 5 MB · faqat PDF</span>
        </div>

        {error && (
          <div className={styles.errorMsg}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          className={styles.analyzeBtn}
          onClick={handleAnalyze}
          disabled={!file || analyzing}
        >
          {analyzing ? 'Tahlil qilinmoqda...' : 'Rezumeni tahlil qilish'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className={`${styles.card} animate-in`} style={{ marginTop: 20 }}>
          <h4 className={styles.cardTitle}>Tahlil natijalari</h4>
          {result.demo && (
            <p className={styles.demoNote}>
              Backend ulangan emas — demo natija ko'rsatilmoqda
            </p>
          )}

          {/* Match Percent */}
          <div className={styles.matchBox}>
            <span className={styles.matchPercent}>
              {result.match_analysis?.match_percent ?? 0}%
            </span>
            <span className={styles.matchLabel}>
              {selectedCareer.name_uz || selectedCareer.nameUz} kasbiga moslik
            </span>
          </div>

          {/* Keywords */}
          {result.keywords && Object.keys(result.keywords).length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h5 className={styles.sectionTitle}>Topilgan kalit so'zlar</h5>
              {Object.entries(result.keywords).map(([cat, words]) => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <span className={styles.catLabel}>{cat}</span>
                  <div className={styles.chipGroup}>
                    {words.map((w) => (
                      <span key={w} className={styles.chip}>{w}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Matched / Missing */}
          {result.match_analysis && (
            <div style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <span className={styles.skillLabel} style={{ color: 'var(--accent)' }}>
                  <CheckCircle size={14} />
                  Mos kelgan ko'nikmalar ({result.match_analysis.matched_skills?.length || 0})
                </span>
                <div className={styles.chipGroup}>
                  {(result.match_analysis.matched_skills || []).map((s) => (
                    <span key={s} className={styles.chipGreen}>{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className={styles.skillLabel} style={{ color: 'var(--accent-warm)' }}>
                  <AlertCircle size={14} />
                  Yetishmayotgan ko'nikmalar ({result.match_analysis.missing_skills?.length || 0})
                </span>
                <div className={styles.chipGroup}>
                  {(result.match_analysis.missing_skills || []).map((s) => (
                    <span key={s} className={styles.chipOrange}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
