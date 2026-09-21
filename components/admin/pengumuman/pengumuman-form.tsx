"use client";

import { Editor } from "@tinymce/tinymce-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { InputText } from "@/components/ui/input-text";
import type { PengumumanRow } from "./pengumuman-manager";
import type { PengumumanActionState } from "./schema";

type PengumumanFormProps = {
  content: string;
  formAction: (payload: FormData) => void;
  pending: boolean;
  selected: PengumumanRow | null;
  state: PengumumanActionState;
  tinyApiKey: string;
  onCancel: () => void;
  onContentChange: (value: string) => void;
};

export function PengumumanForm({
  content,
  formAction,
  pending,
  selected,
  state,
  tinyApiKey,
  onCancel,
  onContentChange,
}: PengumumanFormProps) {
  return (
    <form action={formAction} className="mt-6 space-y-5">
      {selected && <input name="id" type="hidden" value={selected.id} />}

      <div className="grid grid-cols-8 gap-x-6 gap-y-4">
        <div className="col-span-8">
          <InputText
            defaultValue={selected?.judul ?? ""}
            error={state.errors?.judul?.[0]}
            label="Judul"
            name="judul"
            required
          />
        </div>
        <div className="col-span-8">
          <FormField error={state.errors?.isi?.[0]} id="isi" label="Isi pengumuman">
            <input name="isi" type="hidden" value={content} />
            <div className="overflow-hidden rounded-xl border border-[var(--line)] focus-within:ring-2 focus-within:ring-[var(--pacific)]">
              <Editor
                apiKey={tinyApiKey}
                value={content}
                onEditorChange={onContentChange}
                init={{
                  content_style:
                    "body { font-family: system-ui, sans-serif; font-size: 14px; }",
                  height: 360,
                  menubar: false,
                  plugins: "autolink link lists",
                  toolbar:
                    "undo redo | blocks | bold italic underline strikethrough | bullist numlist blockquote | link | removeformat",
                }}
              />
            </div>
          </FormField>
        </div>
        <div className="col-span-8">
          <Checkbox
            defaultChecked={selected?.diterbitkan ?? false}
            label="Terbitkan pengumuman"
            name="diterbitkan"
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button disabled={pending} loading={pending} type="submit">
          {pending ? "Memproses..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}
