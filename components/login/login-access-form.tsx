/** @format */

"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, LockKeyhole, UserRound } from "lucide-react";

import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { InputPassword } from "../ui/input-password";
import { InputText } from "../ui/input-text";

type FormErrors = {
  identity?: string;
  password?: string;
  general?: string;
};

export function LoginAccessForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function clearError(field: keyof FormErrors) {
    setErrors((current) => {
      const updated = { ...current };
      delete updated[field];
      return updated;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSuccess(false);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const identity = String(formData.get("identity") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: FormErrors = {};

    if (!identity) nextErrors.identity = "Masukkan email anda";
    if (!password) nextErrors.password = "Masukkan kata sandi Anda.";
    else if (password.length < 6)
      nextErrors.password = "Kata sandi minimal 6 karakter.";

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ identity, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || "Login gagal. Silakan coba lagi." });
        setIsLoading(false);
        return;
      }

      // Login berhasil
      setIsSuccess(true);

      // Semua peran (ADMIN, Ketua Unsur, Koordinator Unsur) masuk ke /admin.
      // Tampilan & aksi di dalamnya dibatasi sesuai Hak Akses masing-masing peran.
      setTimeout(() => {
        router.replace("/admin");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "Terjadi kesalahan koneksi. Silakan coba lagi." });
      setIsLoading(false);
    }
  }

  return (
    <form
      autoComplete="off"
      className="login-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <InputText
        disabled={isLoading}
        error={errors.identity}
        icon={<UserRound aria-hidden="true" size={19} />}
        id="identity"
        label="Username"
        name="identity"
        onChange={() => errors.identity && clearError("identity")}
        placeholder="Masukkan username anda"
        required
      />

      <InputPassword
        autoComplete="new-password"
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
        <Checkbox
          disabled={isLoading}
          id="remember"
          label="Ingat saya"
          name="remember"
        />
      </div>

      <Button
        className="login-submit"
        disabled={isLoading}
        loading={isLoading}
        type="submit"
      >
        {isLoading ? "Memeriksa akun..." : "Masuk ke akun"}
      </Button>

      <div aria-atomic="true" aria-live="polite" className="form-feedback">
        {errors.general && (
          <div className="alert alert-error" role="alert">
            <span>{errors.general}</span>
          </div>
        )}
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
