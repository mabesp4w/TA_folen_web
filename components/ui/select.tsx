import type { ReactNode, SelectHTMLAttributes } from "react";

import { FormField } from "./form-field";

export type SelectOption<T extends string = string> = {
  disabled?: boolean;
  label: ReactNode;
  value: T;
};

export type SelectProps<T extends string = string> = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  helpText?: string;
  label?: ReactNode;
  options: readonly SelectOption<T>[];
  placeholder?: string;
};

export function Select<T extends string = string>({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  error,
  helpText,
  id,
  label,
  name,
  options,
  placeholder,
  required,
  ...props
}: SelectProps<T>) {
  const selectId = id ?? name;

  if (!selectId) {
    throw new Error("Select requires an id or name.");
  }

  const descriptionId = error ? `${selectId}-error` : helpText ? `${selectId}-help` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  return (
    <FormField error={error} helpText={helpText} id={selectId} label={label} required={required}>
      <div className="relative">
        <select
          {...props}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          className={`select select-bordered login-select w-full appearance-none pr-10 ${error ? "select-error" : ""} ${className}`.trim()}
          id={selectId}
          name={name}
          required={required}
        >
          {placeholder && (
            <option disabled={required} value="">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-current opacity-60"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>
    </FormField>
  );
}
