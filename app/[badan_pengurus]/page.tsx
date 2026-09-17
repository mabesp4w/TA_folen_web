type BadanPengurusPageProps = {
  params: Promise<{ badan_pengurus: string }>;
};

export default async function BadanPengurusPage({ params }: BadanPengurusPageProps) {
  const { badan_pengurus } = await params;
  const namaUnsur = badan_pengurus
    .split("-")
    .map((bagian) => bagian.charAt(0).toUpperCase() + bagian.slice(1))
    .join(" ");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold">Dashboard {namaUnsur}</h1>
      <p className="mt-2 text-base-content/70">
        Selamat datang di ruang pengelolaan badan pengurus {namaUnsur}.
      </p>
    </main>
  );
}
