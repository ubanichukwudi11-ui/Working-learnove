"use client";

import { useState } from "react";

import ForgotPasswordForm from "./ForgotPasswordForm";
import SuccessState from "./SuccessState";

export default function ForgotPasswordCard() {
  const [success, setSuccess] = useState(false);

  return (
    <div className="w-full max-w-[450px]">
      <div
        className="
        bg-[#111827]
        border
        border-slate-800
        rounded-2xl
        p-6
        md:p-8
        shadow-xl
      "
      >
        {success ? (
          <SuccessState />
        ) : (
          <ForgotPasswordForm
            onSuccess={() => setSuccess(true)}
          />
        )}
      </div>
    </div>
  );
}