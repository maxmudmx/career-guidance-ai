import { useEffect, useRef, useState } from 'react';
import { Button, Card } from '../components/ui';
import { userAPI, tokenStorage } from '../services/api';


function staticBase() {
  return (
    import.meta.env.VITE_STATIC_URL ||
    (import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:8000')
  );
}

function fullAvatar(url) {
  if (!url) return null;
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${staticBase()}${url}`;
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
        className="absolute top-4 right-4 px-3 py-1.5 text-sm text-white bg-white/10 hover:bg-white/20 rounded-lg"
      >
        Yopish
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


function ActionButton({ label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-3.5 px-3 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 text-sm font-medium"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text)',
      }}
    >
      {label}
    </button>
  );
}


export default function ProfilePage({ user: initialUser, onBack, onUserUpdate }) {
  const [profile, setProfile] = useState(initialUser);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    userAPI.getProfile()
      .then((res) => setProfile(res.data))
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
      showSuccess("Avatar yangilandi");
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

  const handleProfileSaved = (updated, newToken) => {
    setProfile((p) => ({ ...p, ...updated }));
    onUserUpdate?.(updated);
    if (newToken) tokenStorage.set(newToken);
    setEditModalOpen(false);
    showSuccess("Profil yangilandi");
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const months = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
    const mm = months[d.getMonth()];
    const yyyy = d.getFullYear();
    return `${dd}-${mm}, ${yyyy}`;
  };

  const avatarSrc = fullAvatar(profile?.avatar_url);
  const initials = (profile?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6" style={{ background: 'var(--bg)' }}>
      <div className="max-w-xl mx-auto">

        {/* Bildirishnomalar */}
        {success && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
            {error}
          </div>
        )}

        {/* Avatar bo'limi */}
        <div className="text-center mb-6">
          <div
            onClick={avatarSrc ? () => setViewerOpen(true) : undefined}
            className={`relative w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden ${avatarSrc ? 'cursor-pointer' : ''}`}
            style={{ background: 'var(--text)', color: 'var(--bg)' }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-semibold" style={{ color: 'var(--bg)' }}>{initials}</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs">
                Yuklanmoqda...
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {profile?.full_name || profile?.username}
          </h1>
          <p className="text-sm flex items-center justify-center gap-1.5 mt-1" style={{ color: 'var(--text-muted)' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--text)' }} />
            onlayn
          </p>
        </div>

        {/* Tugmalar */}
        <div className="flex gap-3 mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileSelect}
            className="hidden"
          />
          <ActionButton
            label="Rasm belgilash"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          />
          <ActionButton
            label="Axborotni tahrirlash"
            onClick={() => setEditModalOpen(true)}
          />
        </div>

        {profile?.avatar_url && (
          <div className="mb-6 text-center">
            <button
              onClick={handleDeleteAvatar}
              disabled={uploading}
              className="text-xs opacity-70 hover:opacity-100 transition-opacity disabled:opacity-50"
              style={{ color: 'var(--text-muted)' }}
            >
              Avatarni o'chirish
            </button>
          </div>
        )}

        {/* Ma'lumotlar */}
        <Card className="overflow-hidden">
          {profile?.full_name && (
            <ProfileRow label="To'liq ism" value={profile.full_name} />
          )}
          <ProfileRow label="Foydalanuvchi nomi" value={`@${profile?.username || ''}`} />
          {profile?.email && (
            <ProfileRow label="Email" value={profile.email} />
          )}
          {profile?.region && (
            <ProfileRow label="Region" value={profile.region} />
          )}
          {profile?.date_of_birth && (
            <ProfileRow label="Tug'ilgan kun" value={formatDate(profile.date_of_birth)} />
          )}
          {profile?.stats && (
            <ProfileRow label="Topshirilgan testlar" value={`${profile.stats.test_count || 0} ta`} />
          )}
        </Card>

        {viewerOpen && avatarSrc && (
          <ImageViewer src={avatarSrc} onClose={() => setViewerOpen(false)} />
        )}

        {editModalOpen && (
          <EditProfileModal
            profile={profile}
            onClose={() => setEditModalOpen(false)}
            onSaved={handleProfileSaved}
            onError={showError}
          />
        )}
      </div>
    </div>
  );
}


function ProfileRow({ label, value }) {
  return (
    <div
      className="px-5 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="text-base mb-0.5" style={{ color: 'var(--text)' }}>
        {value || '—'}
      </div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}


function EditProfileModal({ profile, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    region: profile?.region || '',
    date_of_birth: profile?.date_of_birth || '',
    email: profile?.email || '',
    username: profile?.username || '',
    new_password: '',
    current_password: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {};
    if (form.full_name !== (profile?.full_name || '')) payload.full_name = form.full_name;
    if (form.region !== (profile?.region || '')) payload.region = form.region;
    if (form.date_of_birth !== (profile?.date_of_birth || '')) payload.date_of_birth = form.date_of_birth;
    if (form.email !== profile?.email) payload.email = form.email;
    if (form.username !== profile?.username) payload.username = form.username;
    if (form.new_password) payload.new_password = form.new_password;
    if (form.current_password) payload.current_password = form.current_password;

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const res = await userAPI.editProfile(payload);
      onSaved(res.data.user, res.data.access_token);
    } catch (err) {
      onError(err?.response?.data?.detail || "Saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: 'var(--surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Axborotni tahrirlash
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-lg text-sm hover:opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            Yopish
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-3">
          <FormField
            label="To'liq ism"
            value={form.full_name}
            onChange={(v) => setForm({ ...form, full_name: v })}
            placeholder="Ismingiz va familiyangiz"
          />
          <FormField
            label="Username"
            value={form.username}
            onChange={(v) => setForm({ ...form, username: v })}
            placeholder="username"
          />
          <FormField
            label="Email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
            placeholder="email@example.com"
            type="email"
          />
          <FormField
            label="Region"
            value={form.region}
            onChange={(v) => setForm({ ...form, region: v })}
            placeholder="Toshkent, Samarqand, ..."
          />
          <FormField
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
              label="Joriy parol (parol/email/username o'zgarsa zarur)"
              value={form.current_password}
              onChange={(v) => setForm({ ...form, current_password: v })}
              placeholder="Joriy parol"
              type={showPwd ? 'text' : 'password'}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="text-xs px-2 opacity-60 hover:opacity-100"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPwd ? "Yashir" : "Ko'rsat"}
                </button>
              }
            />
            <FormField
              label="Yangi parol"
              value={form.new_password}
              onChange={(v) => setForm({ ...form, new_password: v })}
              placeholder="Yangi parol (kamida 6 belgi)"
              type={showPwd ? 'text' : 'password'}
            />
          </div>

          <div className="flex gap-2 pt-3">
            <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
              Bekor qilish
            </Button>
            <Button variant="primary" type="submit" disabled={saving} className="flex-1">
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


function FormField({ label, value, onChange, placeholder, type = 'text', trailing }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-16 rounded-lg text-sm outline-none border focus:border-blue-500"
          style={{
            background: 'var(--bg)',
            color: 'var(--text)',
            borderColor: 'var(--border)',
          }}
        />
        {trailing && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
