import { useEffect, useRef, useState } from 'react';
import {
  User, Mail, Eye, EyeOff, Lock, Camera, Edit3, Check, X,
  MapPin, Calendar, ArrowLeft, Loader2, AlertCircle, CheckCircle,
  Trash2, ClipboardCheck,
} from 'lucide-react';
import { Button, Card } from '../components/ui';
import { userAPI, tokenStorage } from '../services/api';


function AvatarLarge({ avatarUrl, username, onClick, uploading }) {
  const initials = (username || 'U').slice(0, 2).toUpperCase();
  const STATIC_BASE =
    import.meta.env.VITE_STATIC_URL ||
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000');

  const src = avatarUrl
    ? avatarUrl.startsWith('blob:') || avatarUrl.startsWith('http')
      ? avatarUrl
      : `${STATIC_BASE}${avatarUrl}`
    : null;

  return (
    <div
      onClick={src ? onClick : undefined}
      className={`relative w-32 h-32 rounded-full flex items-center justify-center overflow-hidden mx-auto ${src ? 'cursor-pointer' : ''}`}
      style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
      title={src ? "Rasmni katta ko'rish" : ''}
    >
      {src ? (
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white text-4xl font-semibold">{initials}</span>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
      )}
    </div>
  );
}


function ImageViewer({ src, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <img
        src={src}
        alt="avatar"
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}


export default function ProfilePage({ user: initialUser, onBack, onUserUpdate }) {
  const [profile, setProfile] = useState(initialUser);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  // Forma maydonlari
  const [form, setForm] = useState({
    full_name: '',
    region: '',
    date_of_birth: '',
    email: '',
    username: '',
    new_password: '',
    current_password: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userAPI.getProfile()
      .then((res) => {
        setProfile(res.data);
        setForm({
          full_name: res.data.full_name || '',
          region: res.data.region || '',
          date_of_birth: res.data.date_of_birth || '',
          email: res.data.email || '',
          username: res.data.username || '',
          new_password: '',
          current_password: '',
        });
      })
      .catch(() => {});
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (msg) => {
    setError(msg);
    setSuccess('');
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError("Rasm hajmi 5 MB dan oshmasligi kerak");
      return;
    }
    setUploading(true);
    setError('');
    try {
      const res = await userAPI.uploadAvatar(file);
      setProfile((p) => ({ ...p, avatar_url: res.data.avatar_url }));
      onUserUpdate?.({ ...profile, avatar_url: res.data.avatar_url });
      showSuccess("Avatar muvaffaqiyatli yangilandi");
    } catch (err) {
      showError(err?.response?.data?.detail || "Avatar yuklab bo'lmadi");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.avatar_url) return;
    if (!confirm("Avatarni o'chirishni xohlaysizmi?")) return;
    setUploading(true);
    try {
      await userAPI.deleteAvatar();
      setProfile((p) => ({ ...p, avatar_url: null }));
      onUserUpdate?.({ ...profile, avatar_url: null });
      showSuccess("Avatar o'chirildi");
    } catch (err) {
      showError("O'chirib bo'lmadi");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {};
    if (form.full_name !== (profile?.full_name || '')) payload.full_name = form.full_name;
    if (form.region !== (profile?.region || '')) payload.region = form.region;
    if (form.date_of_birth !== (profile?.date_of_birth || '')) payload.date_of_birth = form.date_of_birth;
    if (form.email !== profile?.email) payload.email = form.email;
    if (form.username !== profile?.username) payload.username = form.username;
    if (form.new_password) payload.new_password = form.new_password;
    if (form.current_password) payload.current_password = form.current_password;

    if (Object.keys(payload).length === 0) {
      setEditMode(false);
      return;
    }

    setSaving(true);
    try {
      const res = await userAPI.editProfile(payload);
      const updatedUser = res.data.user;
      setProfile((p) => ({ ...p, ...updatedUser }));
      onUserUpdate?.(updatedUser);
      if (res.data.access_token) {
        tokenStorage.set(res.data.access_token);
      }
      setEditMode(false);
      setForm((f) => ({ ...f, new_password: '', current_password: '' }));
      showSuccess("Profil yangilandi");
    } catch (err) {
      showError(err?.response?.data?.detail || "Saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setError('');
    setForm({
      full_name: profile?.full_name || '',
      region: profile?.region || '',
      date_of_birth: profile?.date_of_birth || '',
      email: profile?.email || '',
      username: profile?.username || '',
      new_password: '',
      current_password: '',
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('uz-UZ', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const STATIC_BASE =
    import.meta.env.VITE_STATIC_URL ||
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : 'http://localhost:8000');

  const fullAvatarUrl = profile?.avatar_url
    ? profile.avatar_url.startsWith('blob:') || profile.avatar_url.startsWith('http')
      ? profile.avatar_url
      : `${STATIC_BASE}${profile.avatar_url}`
    : null;

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Tepa - back + edit tugma */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft size={16} /> Orqaga
          </Button>
          {!editMode ? (
            <Button variant="primary" onClick={() => setEditMode(true)}>
              <Edit3 size={16} /> Ma'lumotlarni tahrirlash
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCancelEdit} disabled={saving}>
                <X size={16} /> Bekor qilish
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Saqlash
              </Button>
            </div>
          )}
        </div>

        {/* Bildirishnomalar */}
        {success && (
          <div
            className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
            style={{ background: 'var(--success-bg)', color: '#16A34A' }}
          >
            <CheckCircle size={16} /> {success}
          </div>
        )}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm flex items-center gap-2"
            style={{ background: 'var(--error-bg)', color: '#DC2626' }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Avatar + asosiy ma'lumot */}
        <Card className="p-8 mb-6 text-center">
          <AvatarLarge
            avatarUrl={profile?.avatar_url}
            username={profile?.username}
            onClick={() => fullAvatarUrl && setViewerOpen(true)}
            uploading={uploading}
          />

          {/* Avatar tugmalari */}
          <div className="flex justify-center gap-2 mt-4 mb-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              <Camera size={14} /> Rasm yuklash
            </button>
            {profile?.avatar_url && (
              <button
                onClick={handleDeleteAvatar}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: 'var(--bg-hover)', color: '#DC2626' }}
              >
                <Trash2 size={14} /> O'chirish
              </button>
            )}
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
            {profile?.full_name || profile?.username}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            @{profile?.username}
          </p>
        </Card>

        {/* Ma'lumotlar yoki tahrirlash formasi */}
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)' }}>
            {editMode ? "Ma'lumotlarni tahrirlash" : "Shaxsiy ma'lumotlar"}
          </h2>

          {!editMode ? (
            <div className="space-y-1">
              <InfoRow icon={User} label="To'liq ism" value={profile?.full_name} />
              <InfoRow icon={Mail} label="Email" value={profile?.email} />
              <InfoRow icon={MapPin} label="Region" value={profile?.region} />
              <InfoRow icon={Calendar} label="Tug'ilgan sana" value={formatDate(profile?.date_of_birth)} />
              <InfoRow icon={Calendar} label="Ro'yxatdan o'tilgan" value={formatDate(profile?.created_at)} />
              {profile?.stats && (
                <InfoRow
                  icon={ClipboardCheck}
                  label="Topshirilgan testlar"
                  value={`${profile.stats.test_count || 0} ta`}
                />
              )}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-3">
              <FormField
                icon={User}
                label="To'liq ism"
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
                placeholder="Ismingiz va familiyangiz"
              />
              <FormField
                icon={User}
                label="Username"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                placeholder="username"
              />
              <FormField
                icon={Mail}
                label="Email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="email@example.com"
                type="email"
              />
              <FormField
                icon={MapPin}
                label="Region"
                value={form.region}
                onChange={(v) => setForm({ ...form, region: v })}
                placeholder="Toshkent, Samarqand, ..."
              />
              <FormField
                icon={Calendar}
                label="Tug'ilgan sana"
                value={form.date_of_birth}
                onChange={(v) => setForm({ ...form, date_of_birth: v })}
                type="date"
              />

              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Parolni o'zgartirish uchun joriy parol va yangi parolni kiriting:
                </p>
                <FormField
                  icon={Lock}
                  label="Joriy parol"
                  value={form.current_password}
                  onChange={(v) => setForm({ ...form, current_password: v })}
                  placeholder="Joriy parol"
                  type={showPwd ? 'text' : 'password'}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="p-1.5 opacity-60 hover:opacity-100"
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
                <FormField
                  icon={Lock}
                  label="Yangi parol"
                  value={form.new_password}
                  onChange={(v) => setForm({ ...form, new_password: v })}
                  placeholder="Yangi parol (kamida 6 belgi)"
                  type={showPwd ? 'text' : 'password'}
                />
              </div>
            </form>
          )}
        </Card>

        {viewerOpen && fullAvatarUrl && (
          <ImageViewer src={fullAvatarUrl} onClose={() => setViewerOpen(false)} />
        )}
      </div>
    </div>
  );
}


function InfoRow({ icon: Icon, label, value }) {
  return (
    <div
      className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--accent-soft)' }}
      >
        <Icon size={16} style={{ color: 'var(--accent)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {label}
        </div>
        <div className="text-sm break-all" style={{ color: 'var(--text)' }}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}


function FormField({ icon: Icon, label, value, onChange, placeholder, type = 'text', trailing }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg text-sm outline-none border focus:border-blue-500"
          style={{
            background: 'var(--surface)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
          }}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
