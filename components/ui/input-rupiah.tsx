"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useState } from "react";

import { FormField } from "./form-field";

// Batas aman kolom Int MySQL (32-bit) — selaras dengan validasi zod di schema keuangan.
const MAX_RUPIAH = 2_147_483_647;

export type InputRupiahProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "inputMode" | "onChange"
> & {
  error?: string;
  helpText?: string;
  icon?: ReactNode;
  label?: ReactNode;
  /** Nilai awal dalam angka bulat (rupiah tanpa pemisah). */
  defaultValue?: number | string | null;
  /** Dipanggil dengan nilai numerik mentah tiap kali berubah (null bila kosong). */
  onValueChange?: (value: number | null) => void;
};

/** Ambil digit saja dan buang nol di depan. Mengembalikan "" bila tidak ada digit. */
function toDigits(value: number | string | null | undefined): string {
  if (value == null) return "";
  const digits = String(value).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  return Number(digits) > MAX_RUPIAH ? String(MAX_RUPIAH) : digits;
}

/** Sisipkan titik sebagai pemisah ribuan (format Indonesia). */
function formatRupiah(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function InputRupiah({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className = "",
  defaultValue,
  disabled,
  error,
  helpText,
  icon,
  id,
  label,
  name,
  onValueChange,
  required,
  ...props
}: InputRupiahProps) {
  const inputId = id ?? name;

  if (!inputId) {
    throw new Error("InputRupiah requires an id or name.");
  }

  const [digits, setDigits] = useState(() => toDigits(defaultValue));

  const descriptionId = error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  return (
    <FormField error={error} helpText={helpText} id={inputId} label={label} required={required}>
      <label className={`input input-bordered login-input ${error ? "input-error" : ""} ${className}`.trim()}>
        {icon ?? <span aria-hidden="true" className="font-semibold text-[var(--muted)]">Rp</span>}
        <input
          {...props}
          aria-describedby={describedBy}
          aria-invalid={ariaInvalid ?? Boolean(error)}
          autoComplete="off"
          disabled={disabled}
          id={inputId}
          inputMode="numeric"
          required={required}
          type="text"
          value={formatRupiah(digits)}
          onChange={(event) => {
            const next = toDigits(event.target.value);
            setDigits(next);
            onValueChange?.(next ? Number(next) : null);
          }}
        />
      </label>
      {/* Nilai mentah (hanya digit) yang benar-benar dikirim ke server action. */}
      <input disabled={disabled} name={name} type="hidden" value={digits} />
    </FormField>
  );
}
