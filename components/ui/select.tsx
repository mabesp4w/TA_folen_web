import type { ChangeEventHandler, ReactNode, SelectHTMLAttributes } from "react";
import ReactSelect from "react-select";
import type { ActionMeta, Props as ReactSelectProps } from "react-select";

import { FormField } from "./form-field";

export type SelectOption<T extends string = string> = {
  disabled?: boolean;
  label: ReactNode;
  value: T;
};

/**
 * Props for the shared Select component.
 *
 * When `variant="react-select"` (default "native"):
 *   - `defaultValue`/`value` should be the full option object (not a bare string)
 *   - `onChange` receives `(option | null, actionMeta)` from react-select
 *
 * When `variant="native"` (default):
 *   - `defaultValue`/`value` are bare string values
 *   - `onChange` is a standard DOM ChangeEventHandler
 */
export type SelectProps<T extends string = string> = {
  className?: string;
  defaultValue?: string | SelectOption<T> | null;
  error?: string;
  helpText?: string;
  id?: string;
  label?: ReactNode;
  name?: string;
  onChange?:
    | ChangeEventHandler<HTMLSelectElement>
    | ((value: SelectOption<T> | null, actionMeta: ActionMeta<SelectOption<T>>) => void);
  options: readonly SelectOption<T>[];
  placeholder?: string;
  required?: boolean;
  value?: string | SelectOption<T> | null;
  variant?: "native" | "react-select";
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "defaultValue" | "value" | "onChange" | "options" | "name">;

export function Select<T extends string = string>({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  defaultValue,
  disabled,
  error,
  helpText,
  id,
  label,
  name,
  onChange,
  options,
  placeholder,
  required,
  value,
  variant = "native",
  ...props
}: SelectProps<T>) {
  const selectId = id ?? name;

  if (!selectId) {
    throw new Error("Select requires an id or name.");
  }

  const descriptionId = error
    ? `${selectId}-error`
    : helpText
      ? `${selectId}-help`
      : undefined;
  const describedBy =
    [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  if (variant === "react-select") {
    return (
      <FormField
        error={error}
        helpText={helpText}
        id={selectId}
        label={label}
        required={required}
      >
        <div className="relative">
          <ReactSelect<SelectOption<T>>
            aria-describedby={describedBy}
            aria-invalid={ariaInvalid ?? (error ? true : undefined)}
            aria-required={required}
            className={`react-select ${className}`}
            defaultValue={defaultValue as SelectOption<T> | null | undefined}
            instanceId={selectId}
            isDisabled={disabled}
            name={name}
            onChange={onChange as ReactSelectProps<SelectOption<T>>["onChange"]}
            options={options as SelectOption<T>[]}
            placeholder={placeholder}
            isClearable
            isSearchable
            menuPortalTarget={
              typeof document !== "undefined" ? document.body : undefined
            }
            menuPosition="fixed"
            styles={{
              control: (base) => ({
                ...base,
                backgroundColor: "var(--paper)",
                borderColor: "var(--line)",
                borderRadius: "0.5rem",
                boxShadow: "none",
                minHeight: "3.25rem",
              }),
              menuPortal: (base) => ({
                ...base,
                zIndex: 1100,
              }),
              menu: (base) => ({
                ...base,
                backgroundColor: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: "0.5rem",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              }),
              option: (base, state) => ({
                ...base,
                backgroundColor: state.isSelected
                  ? "var(--forest)"
                  : "var(--paper)",
                color: state.isSelected ? "var(--paper)" : "var(--ink)",
                minHeight: "auto",
                padding: "0.625rem 1rem",
                "&:hover": {
                  backgroundColor: "var(--forest)",
                  color: "var(--paper)",
                },
              }),
              singleValue: (base) => ({
                ...base,
                color: "var(--ink)",
              }),
            }}
            value={value as SelectOption<T> | null | undefined}
          />
        </div>
      </FormField>
    );
  }

  return (
    <FormField
      error={error}
      helpText={helpText}
      id={selectId}
      label={label}
      required={required}
    >
      <div className="relative">
        <select
          {...(props as SelectHTMLAttributes<HTMLSelectElement>)}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          className={`select select-bordered login-select w-full appearance-none pr-10 ${error ? "select-error" : ""} ${className}`.trim()}
          defaultValue={defaultValue as string | undefined}
          id={selectId}
          name={name}
          onChange={onChange as SelectHTMLAttributes<HTMLSelectElement>["onChange"]}
          required={required}
          value={value as string | undefined}
        >
          {placeholder && (
            <option disabled={required} value="">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              disabled={option.disabled}
              key={option.value}
              value={option.value}
            >
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
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </div>
    </FormField>
  );
}
