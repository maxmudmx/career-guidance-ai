import { Field, PasswordField, Checkbox } from './Field';
import { Button } from '../../components/ui';

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
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field
        label="Username"
        name="username"
        value={form.username}
        onChange={onChange}
        placeholder="username"
        autoComplete="username"
        error={errors.username}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={onChange}
        placeholder="sizning@email.com"
        autoComplete="email"
        error={errors.email}
      />
      <PasswordField
        label="Parol"
        name="password"
        value={form.password}
        onChange={onChange}
        placeholder="kamida 6 ta belgi"
        autoComplete="new-password"
        error={errors.password}
      />

      <Checkbox name="agree" checked={agreed} onChange={onAgreeChange}>
        Men <span className="text-[#2563EB]">Foydalanish shartlari</span> va{' '}
        <span className="text-[#2563EB]">Maxfiylik siyosati</span>ga roziman
      </Checkbox>

      {serverError && (
        <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg text-sm text-[#DC2626]">
          {serverError}
        </div>
      )}

      <Button
        variant="primary"
        type="submit"
        disabled={loading || !agreed}
        className="w-full mt-2"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          "Ro'yxatdan o'tish"
        )}
      </Button>
    </form>
  );
}
