import { memo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Barqaror dark forma input — barcha uslublar CSS class orqali.
 * Inline style ishlatilmaydi → har keystroke da React DOM ga aralashmaydi.
 */
function FieldImpl({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  autoComplete,
}) {
  return (
    <div>
      {label && <label className="label-dark">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`input-dark ${error ? 'input-error' : ''}`}
      />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
export const Field = memo(FieldImpl);

function PasswordFieldImpl({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  autoComplete = 'current-password',
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <label className="label-dark">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`input-dark input-password ${error ? 'input-error' : ''}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          className="password-toggle"
          aria-label={show ? 'Parolni yashirish' : "Parolni ko'rish"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
export const PasswordField = memo(PasswordFieldImpl);

function CheckboxImpl({ name, checked, onChange, children }) {
  return (
    <label className="checkbox-dark">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span>{children}</span>
    </label>
  );
}
export const Checkbox = memo(CheckboxImpl);
