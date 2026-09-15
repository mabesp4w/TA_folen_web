import type { InputHTMLAttributes, ReactNode } from "react";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string;
  helpText?: string;
  label: ReactNode;
};

export function Checkbox({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  error,
  helpText,
  id,
  label,
  name,
  ...props
}: CheckboxProps) {
  const inputId = id ?? name;

  if (!inputId) {
    throw new Error("Checkbox requires an id or name.");
  }

  const descriptionId = error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="checkbox-field">
      <label className="remember-option" htmlFor={inputId}>
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          className={`checkbox checkbox-sm ${className}`.trim()}
          id={inputId}
          name={name}
          type="checkbox"
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="field-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      ) : helpText ? (
        <p className="field-help" id={`${inputId}-help`}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
