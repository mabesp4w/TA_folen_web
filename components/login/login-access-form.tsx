"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { CheckCircle2, LockKeyhole, UserRound } from "lucide-react";

import { Checkbox } from "../ui/checkbox";
import { InputPassword } from "../ui/input-password";
import { InputText } from "../ui/input-text";

type FormErrors = {
  identity?: string;
  password?: string;
};

export function LoginAccessForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function clearError(field: keyof FormErrors) {
    setErrors((current) =>
      field === "identity"
        ? { ...current, identity: undefined }
        : { ...current, password: undefined },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSuccess(false);

    const formData = new FormData(event.currentTarget);
    const identity = String(formData.get("identity") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: FormErrors = {};

    if (!identity) nextErrors.identity = "Masukkan email atau identitas jemaat Anda.";
    if (!password) nextErrors.password = "Masukkan kata sandi Anda.";
    else if (password.length < 6) nextErrors.password = "Kata sandi minimal 6 karakter.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 900);
  }

  return (
    <form className="login-form" noValidate onSubmit={handleSubmit}>
      <InputText
        autoComplete="username"
        disabled={isLoading}
        error={errors.identity}
        icon={<UserRound aria-hidden="true" size={19} />}
        id="identity"
        label="Email atau identitas jemaat"
        name="identity"
        onChange={() => errors.identity && clearError("identity")}
        placeholder="nama@email.com atau ID jemaat"
        required
      />

      <InputPassword
        autoComplete="current-password"
        disabled={isLoading}
        error={errors.password}
        icon={<LockKeyhole aria-hidden="true" size={19} />}
        id="password"
        label="Kata sandi"
        name="password"
        onChange={() => errors.password && clearError("password")}
        placeholder="Masukkan kata sandi"
        required
      />

      <div className="form-options">
        <Checkbox disabled={isLoading} id="remember" label="Ingat saya" name="remember" />
        <span>Lupa kata sandi?</span>
      </div>

      <button className="login-submit btn" disabled={isLoading} type="submit">
        {isLoading && <span aria-hidden="true" className="loading loading-spinner loading-sm" />}
        {isLoading ? "Memeriksa akun..." : "Masuk ke akun"}
      </button>

      <div aria-atomic="true" aria-live="polite" className="form-feedback">
        {isSuccess && (
          <div className="alert success-alert" role="status">
            <CheckCircle2 aria-hidden="true" size={21} />
            <span>Berhasil masuk. Selamat datang kembali di ruang jemaat.</span>
          </div>
        )}
      </div>
    </form>
  );
}
