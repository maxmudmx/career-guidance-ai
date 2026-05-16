import { Field, PasswordField, Checkbox } from './Field';
import { Button } from '../../components/ui';
import { useTranslation } from '../../contexts/LanguageContext';

export default function SignUpForm({
  form,
  errors,
  serverError,
  loading,
  onChange,
  onSubmit,
  agreed,
  onAgreeChange,
}) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        label={t('auth.field.username')}
        name="username"
        value={form.username}
        onChange={onChange}
        placeholder="username"
        autoComplete="username"
        error={errors.username}
      />
      <Field
        label={t('auth.field.email')}
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        placeholder="your@email.com"
        autoComplete="email"
        error={errors.email}
      />
      <PasswordField
        label={t('auth.field.password')}
        name="password"
        value={form.password}
        onChange={onChange}
        placeholder="••••••••"
        autoComplete="new-password"
        error={errors.password}
      />

      <Checkbox name="agree" checked={agreed} onChange={onAgreeChange}>
        {t('auth.terms')} <span style={{ color: 'var(--text)' }}>{t('auth.terms_link')}</span>
        {' '}&{' '}
        <span style={{ color: 'var(--text)' }}>{t('auth.privacy_link')}</span>
        {t('auth.terms_agree')}
      </Checkbox>

      {serverError && (
        <div className="p-3 rounded-lg text-sm"
          style={{ background: 'var(--bg-hover)', color: 'var(--text)' }}>
          {serverError}
        </div>
      )}

      <Button
        variant="primary"
        type="submit"
        disabled={loading || !agreed}
        className="w-full mt-2"
      >
        {loading ? '...' : t('auth.btn.signup')}
      </Button>
    </form>
  );
}
