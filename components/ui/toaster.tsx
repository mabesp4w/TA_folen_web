"use client";

import { GooeyToaster } from "goey-toast";

export function Toaster() {
  return (
    <GooeyToaster
      closeButton
      position="top-right"
      richColors
      showProgress
    />
  );
}
