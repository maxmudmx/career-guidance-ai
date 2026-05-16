import { Field, PasswordField, Checkbox } from './Field';
import { Button } from '../../components/ui';
import { useTranslation } from '../../contexts/LanguageContext';

export default function LoginForm({
  form,
  errors,
  serverError,
  loading,
  onChange,
  onSubmit,
  remember,
  onRememberChange,
}) {
  const { t } = useTranslation();
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        label={`${t('auth.field.username')} / ${t('auth.field.email')}`}
        name="username"
        value={form.username}
        onChange={onChange}
        placeholder=""
        autoComplete="username"
        error={errors.username}
      />
      <PasswordField
        label={t('auth.field.password')}
        name="password"
        value={form.password}
        onChange={onChange}
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password}
      />

      <div className="flex items-center">
        <Checkbox name="remember" checked={remember} onChange={onRememberChange}>
          {t('auth.field.remember')}
        </Checkbox>
      </div>

      {serverError && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            background: 'var(--bg-hover)',
            color: 'var(--text)',
          }}
        >
          {serverError}
        </div>
      )}

      <Button variant="primary" type="submit" disabled={loading} className="w-full mt-2">
        {loading ? '...' : t('auth.btn.login')}
      </Button>
    </form>
  );
}
