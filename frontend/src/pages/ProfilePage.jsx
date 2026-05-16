import { useState, useEffect, useRef, useCallback } from 'react';
import {
  User, Mail, Eye, EyeOff,
  Lock, Camera, Edit3, Check, X,
  MapPin, Calendar,
} from 'lucide-react';
import { tokenStorage } from '../services/api';
import api from '../services/api';
import { Button, Card } from '../components/ui';
import { BackButton } from '../components/PageHeader';

const usersAPI = {
  getProfile: () => api.get('/users/me'),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/users/upload-avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  editProfile: (payload) => api.post('/users/edit-profile', payload),
};

// ────────────────────────────────────────────────────────────
// Avatar (large, centered) — bosilganda rasmni katta ko'rsatadi
// ────────────────────────────────────────────────────────────
function AvatarLarge({ avatarUrl, username, onClick, uploading }) {
  const initials = (username || 'U').slice(0, 2).toUpperCase();
  const STATIC_BASE = import.meta.env.VITE_STATIC_URL || 'http://localhost:8000';
  const src = avatarUrl
    ? avatarUrl.startsWith('blob:')
      ? avatarUrl
      : `${STATIC_BASE}${avatarUrl}`
    : null;
  const clickable = !!src;
  return (
    <div
      onClick={clickable ? onClick : undefined}
      className={`relative w-32 h-32 rounded-full bg-[#2563EB] flex items-center justify-center overflow-hidden mx-auto
        ${clickable ? 'cursor-pointer' : ''}`}
      title={clickable ? "Rasmni katta ko'rish" : ''}
    >
      {src ? (
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-white text-4xl font-semibold">{initials}</span>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Image viewer (fullscreen lightbox)
// ────────────────────────────────────────────────────────────
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
        aria-label="Yopish"
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

// ────────────────────────────────────────────────────────────
// Inputs
// ────────────────────────────────────────────────────────────
function PasswordField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-white border border-[#E5E7EB] rounded-lg
          focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]
          transition-colors text-[#111827] placeholder:text-[#9CA3AF]"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563]"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = 'text', icon: Icon }) {
  return (
    <div className="relative">
      {Icon && (
        <Icon className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 bg-white border border-[#E5E7EB] rounded-lg
          focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:border-[#2563EB]
          transition-colors text-[#111827] placeholder:text-[#9CA3AF]`}
      />
    </div>
  );
}

function StatusMessage({ error, success }) {
  if (!error && !success) return null;
  return error ? (
    <div className="p-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-xs text-[#DC2626]">
      {error}
    </div>
  ) : (
    <div className="p-2.5 bg-[#ECFDF5] border border-[#BBF7D0] rounded-lg text-xs text-[#16A34A]">
      ✓ {success}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Action button (Telegram-style square)
// ────────────────────────────────────────────────────────────
function ActionButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2
        bg-[#F3F4F6] hover:opacity-80 active:opacity-70
        rounded-xl transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-5 h-5 text-[#2563EB]" />
      <span className="text-xs font-medium text-[#111827]">{label}</span>
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Read-only info row (Telegram-style: value on top, label below)
// ────────────────────────────────────────────────────────────
function InfoRow({ value, label, isLast }) {
  return (
    <div
      className={`flex items-center gap-3 py-3.5 px-4
        ${isLast ? '' : 'border-b border-[#E5E7EB]'}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] text-[#111827] truncate">
          {value || <span className="text-[#9CA3AF] italic">— ko'rsatilmagan —</span>}
        </div>
        <div className="text-xs text-[#6B7280] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Edit modal
// ────────────────────────────────────────────────────────────
function EditPanel({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg text-[#111827] font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </Card>
    </div>
  );
}

// Format ISO date as "fev 01, 2005"
const UZ_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

function formatDateOfBirth(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const day = String(d.getDate()).padStart(2, '0');
    const month = UZ_MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    return `${month} ${day}, ${year}`;
  } catch {
    return iso;
  }
}

// ────────────────────────────────────────────────────────────
// Main ProfilePage
// ────────────────────────────────────────────────────────────
export default function ProfilePage({ onBack }) {
  const fileInputRef = useRef();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Edit form state
  const [form, setForm] = useState({
    first_name: '', last_name: '',
    email: '', username: '', region: '', date_of_birth: '',
    current_password: '',
  });
  const [editState, setEditState] = useState({ loading: false, error: '', success: '' });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getProfile();
      setProfile(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // full_name → { first, last }: bo'sh joydan keyingi qism familiya
  const splitName = (fullName) => {
    const trimmed = (fullName || '').trim();
    if (!trimmed) return { first: '', last: '' };
    const idx = trimmed.indexOf(' ');
    if (idx === -1) return { first: trimmed, last: '' };
    return { first: trimmed.slice(0, idx).trim(), last: trimmed.slice(idx + 1).trim() };
  };

  // Open edit modal — prefill with current profile values
  const openEdit = () => {
    const { first, last } = splitName(profile?.full_name);
    setForm({
      first_name: first,
      last_name: last,
      email: profile?.email || '',
      username: profile?.username || '',
      region: profile?.region || '',
      date_of_birth: profile?.date_of_birth || '',
      current_password: '',
    });
    setEditState({ loading: false, error: '', success: '' });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
  };

  // Avatar upload
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await usersAPI.uploadAvatar(file);
      setProfile((p) => ({ ...p, avatar_url: res.data.avatar_url }));
      const u = tokenStorage.getUser();
      if (u) tokenStorage.setUser({ ...u, avatar_url: res.data.avatar_url });
    } catch (err) {
      alert(err.response?.data?.detail || 'Avatar yuklanmadi');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerAvatarUpload = () => fileInputRef.current?.click();

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSaveAll = async () => {
    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    if (!firstName) {
      setEditState({ loading: false, error: 'Ism kiritilishi shart', success: '' });
      return;
    }
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    const emailChanged = form.email.trim().toLowerCase() !== (profile?.email || '').toLowerCase();
    const usernameChanged = form.username.trim() !== (profile?.username || '');
    const sensitive = emailChanged || usernameChanged;

    if (sensitive && !form.current_password) {
      setEditState({
        loading: false,
        error: "Email yoki usernameni o'zgartirish uchun joriy parolni kiriting",
        success: '',
      });
      return;
    }

    setEditState({ loading: true, error: '', success: '' });

    const payload = {
      full_name: fullName,
      email: form.email.trim(),
      username: form.username.trim(),
      region: form.region,
      date_of_birth: form.date_of_birth,
    };
    if (sensitive) payload.current_password = form.current_password;

    try {
      const res = await usersAPI.editProfile(payload);
      if (res.data.access_token) tokenStorage.set(res.data.access_token);
      const updated = res.data.user || {};
      const u = tokenStorage.getUser();
      if (u) {
        tokenStorage.setUser({
          ...u,
          username: updated.username ?? u.username,
          email: updated.email ?? u.email,
          full_name: updated.full_name ?? u.full_name,
        });
      }
      await loadProfile();
      setEditState({ loading: false, error: '', success: 'Profil yangilandi' });
      setTimeout(() => closeEdit(), 1000);
    } catch (err) {
      setEditState({
        loading: false,
        success: '',
        error: err.response?.data?.detail || 'Xatolik',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB] gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-[#E5E7EB] border-t-[#2563EB] animate-spin" />
        <p className="text-sm text-[#4B5563]">Profil yuklanmoqda...</p>
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || 'Foydalanuvchi';

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-6 px-4 sm:px-6 lg:px-8 font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <div className="max-w-md mx-auto">
        {/* Back */}
        <div className="mb-6">
          <BackButton onClick={onBack} />
        </div>

        {/* Avatar + name */}
        <div className="text-center mb-6">
          <AvatarLarge
            avatarUrl={profile?.avatar_url}
            username={profile?.username}
            onClick={() => setViewerOpen(true)}
            uploading={uploading}
          />
          <h2 className="mt-4 text-2xl text-[#111827] font-semibold">{displayName}</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">onlayn</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <ActionButton
            icon={Camera}
            label="Rasm belgilash"
            onClick={triggerAvatarUpload}
            disabled={uploading}
          />
          <ActionButton
            icon={Edit3}
            label="Axborotni tahrirlash"
            onClick={openEdit}
          />
        </div>

        {/* Info card (read-only) */}
        <Card className="overflow-hidden p-0">
          <InfoRow value={profile?.email} label="Email" />
          <InfoRow value={`@${profile?.username}`} label="Foydalanuvchi nomi" />
          <InfoRow value={profile?.region} label="Region" />
          <InfoRow
            value={formatDateOfBirth(profile?.date_of_birth)}
            label="Tug'ilgan kun"
            isLast
          />
        </Card>
      </div>

      {/* Avatar fullscreen viewer */}
      {viewerOpen && profile?.avatar_url && (
        <ImageViewer
          src={
            profile.avatar_url.startsWith('blob:')
              ? profile.avatar_url
              : `${import.meta.env.VITE_STATIC_URL || 'http://localhost:8000'}${profile.avatar_url}`
          }
          onClose={() => setViewerOpen(false)}
        />
      )}

      {/* Unified edit modal */}
      {editOpen && (
        <EditPanel title="Axborotni tahrirlash" onClose={closeEdit}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[#111827] mb-2">
                Ism <span className="text-[#DC2626]">*</span>
              </label>
              <TextInput
                value={form.first_name}
                onChange={(e) => setField('first_name', e.target.value)}
                placeholder="Ismingiz"
                icon={User}
              />
            </div>

            <div>
              <label className="block text-sm text-[#111827] mb-2">
                Familiya{' '}
                <span className="text-xs text-[#6B7280] font-normal">(ixtiyoriy)</span>
              </label>
              <TextInput
                value={form.last_name}
                onChange={(e) => setField('last_name', e.target.value)}
                placeholder="Familiyangiz"
                icon={User}
              />
            </div>

            <div>
              <label className="block text-sm text-[#111827] mb-2">Email</label>
              <TextInput
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="email@example.com"
                icon={Mail}
              />
            </div>

            <div>
              <label className="block text-sm text-[#111827] mb-2">Foydalanuvchi nomi</label>
              <TextInput
                value={form.username}
                onChange={(e) => setField('username', e.target.value)}
                placeholder="username"
                icon={User}
              />
            </div>

            <div>
              <label className="block text-sm text-[#111827] mb-2">Region</label>
              <TextInput
                value={form.region}
                onChange={(e) => setField('region', e.target.value)}
                placeholder="Toshkent"
                icon={MapPin}
              />
            </div>

            <div>
              <label className="block text-sm text-[#111827] mb-2">Tug'ilgan kun</label>
              <TextInput
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setField('date_of_birth', e.target.value)}
                icon={Calendar}
              />
            </div>

            <div className="border-t border-[#E5E7EB] pt-4 mt-4">
              <label className="block text-sm text-[#111827] mb-2">
                Joriy parol
                <span className="text-xs text-[#6B7280] font-normal ml-1">
                  (email yoki username o'zgartirilsa)
                </span>
              </label>
              <PasswordField
                value={form.current_password}
                onChange={(e) => setField('current_password', e.target.value)}
                placeholder="Joriy parolingiz"
              />
            </div>

            <StatusMessage error={editState.error} success={editState.success} />

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={closeEdit} className="flex-1">
                Bekor qilish
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={editState.loading}
                className="flex-1"
              >
                {editState.loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Saqlash
                  </>
                )}
              </Button>
            </div>
          </div>
        </EditPanel>
      )}
    </div>
  );
}
