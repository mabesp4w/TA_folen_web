/** @format */

import { HeartHandshake, Waves } from "lucide-react";
import Image from "next/image";
import { LoginAccessForm } from "../components/login/login-access-form";

export default function Home() {
  return (
    <main className="login-page">
      <section className="login-story" aria-labelledby="welcome-title">
        <div className="story-content">
          <div className="church-mark" aria-label="GKI Syaloom Pasifik Indah">
            <span className="church-mark-icon" aria-hidden="true">
              <Image
                src="/logo-gki.svg"
                alt=""
                width={50}
                height={50}
                priority
                unoptimized
              />
            </span>
            <span>
              <strong>GKI Syaloom</strong>
              <small>Pasifik Indah</small>
            </span>
          </div>

          <div className="story-message">
            <span className="eyebrow">Ruang bersama jemaat</span>
            <h1 id="welcome-title">
              Bertumbuh dalam iman, berjalan dalam kasih.
            </h1>
            <p>
              Masuk untuk tetap terhubung dengan pelayanan, kegiatan, dan
              kehidupan jemaat GKI Syaloom Pasifik Indah.
            </p>
          </div>

          <div className="story-notes" aria-label="Nilai komunitas">
            <span>
              <HeartHandshake size={18} aria-hidden="true" /> Melayani bersama
            </span>
            <span>
              <Waves size={18} aria-hidden="true" /> Berakar di Tanah Papua
            </span>
          </div>
        </div>

        <div className="papua-landscape" aria-hidden="true">
          <span className="story-sun" />
          <span className="story-mountain story-mountain-back" />
          <span className="story-mountain story-mountain-front" />
          <span className="story-cross" />
          <span className="story-pattern" />
        </div>
      </section>

      <section className="login-access" aria-labelledby="login-title">
        <div className="mobile-brand">
          <span className="church-mark-icon" aria-hidden="true">
            <Image
              src="/logo-gki.svg"
              alt=""
              width={44}
              height={44}
              priority
              unoptimized
            />
          </span>
          <span>
            <strong>GKI Syaloom</strong>
            <small>Pasifik Indah</small>
          </span>
        </div>

        <div className="login-card card bg-base-100">
          <div className="card-body">
            <header className="login-heading">
              <span className="eyebrow">Selamat datang kembali</span>
              <h2 id="login-title">Masuk ke akun Anda</h2>
              <p>Gunakan username dan password Anda.</p>
            </header>
            <LoginAccessForm />
          </div>
        </div>
      </section>
    </main>
  );
}
