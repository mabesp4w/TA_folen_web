"use client";

import { Search } from "lucide-react";
import { InputText } from "@/components/ui/input-text";
import { Select, type SelectOption } from "@/components/ui/select";

type LogFiltersProps = {
  aksiOptions: SelectOption[];
  entitasOptions: SelectOption[];
  filters: { q: string; entitas: string; aksi: string; from: string; to: string };
  onParamChange: (updates: Record<string, string>) => void;
  onSearch: (value: string) => void;
};

export function LogFilters({
  aksiOptions,
  entitasOptions,
  filters,
  onParamChange,
  onSearch,
}: LogFiltersProps) {
  return (
    <form
      aria-label="Filter log aktivitas"
      className="mb-5 grid gap-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 md:grid-cols-2 xl:grid-cols-5"
      onSubmit={(e) => e.preventDefault()}
    >
      <InputText
        defaultValue={filters.q}
        icon={<Search size={17} aria-hidden="true" />}
        label="Cari"
        name="q"
        placeholder="Username / ringkasan"
        type="search"
        onChange={(e) => onSearch(e.currentTarget.value)}
      />
      <Select
        label="Entitas"
        name="entitas"
        options={entitasOptions}
        placeholder="Semua entitas"
        value={filters.entitas}
        variant="native"
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onParamChange({ entitas: e.currentTarget.value })
        }
      />
      <Select
        label="Aksi"
        name="aksi"
        options={aksiOptions}
        placeholder="Semua aksi"
        value={filters.aksi}
        variant="native"
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onParamChange({ aksi: e.currentTarget.value })
        }
      />
      <label className="form-control w-full">
        <span className="label-text mb-2 font-medium">Dari tanggal</span>
        <input
          className="input input-bordered w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)]"
          defaultValue={filters.from}
          name="from"
          type="date"
          onChange={(e) => onParamChange({ from: e.currentTarget.value })}
        />
      </label>
      <label className="form-control w-full">
        <span className="label-text mb-2 font-medium">Sampai tanggal</span>
        <input
          className="input input-bordered w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pacific)]"
          defaultValue={filters.to}
          name="to"
          type="date"
          onChange={(e) => onParamChange({ to: e.currentTarget.value })}
        />
      </label>
    </form>
  );
}
