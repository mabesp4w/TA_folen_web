"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { FormField } from "./form-field";

export type InputPasswordProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string;
  helpText?: string;
  hidePasswordLabel?: string;
  icon?: ReactNode;
  label?: ReactNode;
  showPasswordLabel?: string;
};

export function InputPassword({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  error,
  helpText,
  hidePasswordLabel = "Sembunyikan kata sandi",
  icon,
  id,
  label,
  name,
  required,
  showPasswordLabel = "Tampilkan kata sandi",
  ...props
}: InputPasswordProps) {
  const [isVisible, setIsVisible] = useState(false);
  const inputId = id ?? name;

  if (!inputId) {
    throw new Error("InputPassword requires an id or name.");
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
          type={isVisible ? "text" : "password"}
        />
        <button
          aria-controls={inputId}
          aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
          aria-pressed={isVisible}
          className="password-toggle btn btn-ghost btn-square"
          disabled={props.disabled}
          onClick={() => setIsVisible((current) => !current)}
          type="button"
        >
          {isVisible ? <EyeOff aria-hidden="true" size={20} /> : <Eye aria-hidden="true" size={20} />}
        </button>
      </label>
    </FormField>
  );
}
