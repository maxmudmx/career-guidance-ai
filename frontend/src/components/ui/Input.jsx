import { forwardRef, memo } from 'react';

/**
 * Barqaror dark Input — uslublar CSS class orqali.
 * forwardRef + memo bilan qayta render minimal.
 */
export const Input = memo(
  forwardRef(function Input({ label, error, className = '', ...props }, ref) {
    return (
      <div className="w-full">
        {label && <label className="label-dark">{label}</label>}
        <input
          ref={ref}
          className={`input-dark ${error ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }),
);
