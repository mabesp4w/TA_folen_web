"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { FormField } from "./form-field";

type DatePickerProps = {
  defaultValue?: string;
  error?: string;
  id?: string;
  label?: string;
  name: string;
  required?: boolean;
};

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function parseDate(value?: string) {
  if (!value) return null;

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value: Date | null) {
  if (!value) return "";

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  defaultValue,
  error,
  id,
  label,
  name,
  required,
}: DatePickerProps) {
  const inputId = id ?? name;
  const [selectedDate, setSelectedDate] = useState<Date | null>(() =>
    parseDate(defaultValue),
  );
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, index) => currentYear - index);

  return (
    <FormField
      error={error}
      id={inputId}
      label={label}
      required={required}
    >
      <div className="relative">
        <ReactDatePicker
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-invalid={error ? "true" : "false"}
          className={`input input-bordered w-full pr-11 ${error ? "input-error" : ""}`.trim()}
          dateFormat="dd/MM/yyyy"
          id={inputId}
          maxDate={new Date()}
          onChange={(date: Date | null) => setSelectedDate(date)}
          placeholderText="Pilih tanggal lahir"
          popperPlacement="bottom-start"
        renderCustomHeader={({
          changeMonth,
          changeYear,
          date,
          decreaseMonth,
          increaseMonth,
          nextMonthButtonDisabled,
          prevMonthButtonDisabled,
        }) => (
          <div className="flex items-center gap-2 px-2 py-1">
            <button
              aria-label="Bulan sebelumnya"
              className="btn btn-ghost btn-sm btn-square"
              disabled={prevMonthButtonDisabled}
              onClick={decreaseMonth}
              type="button"
            >
              ‹
            </button>
            <select
              aria-label="Pilih bulan"
              className="select select-bordered select-sm flex-1"
              onChange={({ target }) => changeMonth(Number(target.value))}
              value={date.getMonth()}
            >
              {months.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              aria-label="Pilih tahun"
              className="select select-bordered select-sm w-24"
              onChange={({ target }) => changeYear(Number(target.value))}
              value={date.getFullYear()}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <button
              aria-label="Bulan berikutnya"
              className="btn btn-ghost btn-sm btn-square"
              disabled={nextMonthButtonDisabled}
              onClick={increaseMonth}
              type="button"
            >
              ›
            </button>
          </div>
        )}
          selected={selectedDate}
          showPopperArrow={false}
          wrapperClassName="w-full"
        />
        <CalendarDays
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 opacity-60"
        />
      </div>
      <input
        name={name}
        required={required}
        type="hidden"
        value={formatDate(selectedDate)}
      />
    </FormField>
  );
}
