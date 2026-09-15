import type { InputHTMLAttributes, ReactNode } from "react";

import { FormField } from "./form-field";

export type InputTextProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string;
  helpText?: string;
  icon?: ReactNode;
  label?: ReactNode;
  type?: "email" | "search" | "tel" | "text" | "url";
};

export function InputText({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  error,
  helpText,
  icon,
  id,
  label,
  name,
  required,
  type = "text",
  ...props
}: InputTextProps) {
  const inputId = id ?? name;

  if (!inputId) {
    throw new Error("InputText requires an id or name.");
  }

  const descriptionId = error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  return (
    <FormField error={error} helpText={helpText} id={inputId} label={label} required={required}>
      <label className={`input input-bordered login-input ${error ? "input-error" : ""} ${className}`.trim()}>
        {icon}
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          id={inputId}
          name={name}
          required={required}
          type={type}
        />
      </label>
    </FormField>
  );
}
