"use client";

import { useState } from "react";
import clsx from "clsx";
import LoginForm from "./LoginForm";

export default function FlipCard() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-md perspective min-h-screen flex items-center justify-center mx-auto pt-50">
      <div
        className={clsx(
          "relative w-full h-full transition-transform duration-700",
          flipped ? "rotate-y-180" : ""
        )}
      >
        <div className="absolute w-full backface-hidden">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
