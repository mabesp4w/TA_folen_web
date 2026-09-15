import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  error?: string;
  helpText?: string;
  id: string;
  label?: ReactNode;
  required?: boolean;
};

export function FormField({
  children,
  className = "",
  error,
  helpText,
  id,
  label,
  required,
}: FormFieldProps) {
  return (
    <div className={`form-control ${className}`.trim()}>
      {label && (
        <label className="label" htmlFor={id}>
          <span className="label-text">
            {label}
            {required && <span aria-hidden="true"> *</span>}
          </span>
        </label>
      )}
      {children}
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : helpText ? (
        <p className="field-help" id={`${id}-help`}>
          {helpText}
        </p>
      ) : null}
    </div>
  );
}
