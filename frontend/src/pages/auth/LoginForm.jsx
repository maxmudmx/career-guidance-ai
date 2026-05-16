import { Field, PasswordField, Checkbox } from './Field';
import { Button } from '../../components/ui';

export default function LoginForm({
  form,
  errors,
  serverError,
  loading,
  onChange,
  onSubmit,
  remember,
  onRememberChange,
  onForgotPassword,
}) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        label="Username yoki email"
        name="username"
        value={form.username}
        onChange={onChange}
        placeholder="username yoki email"
        autoComplete="username"
        error={errors.username}
      />
      <PasswordField
        label="Parol"
        name="password"
        value={form.password}
        onChange={onChange}
        placeholder="••••••••"
        autoComplete="current-password"
        error={errors.password}
      />

      <div className="flex items-center">
        <Checkbox name="remember" checked={remember} onChange={onRememberChange}>
          Eslab qol
        </Checkbox>
      </div>

      {serverError && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            color: 'var(--error)',
          }}
        >
          {serverError}
        </div>
      )}

      <Button variant="primary" type="submit" disabled={loading} className="w-full mt-2">
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Kirish'
        )}
      </Button>
    </form>
  );
}
