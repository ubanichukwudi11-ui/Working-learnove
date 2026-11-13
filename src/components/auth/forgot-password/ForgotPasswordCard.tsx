"use client";

import { useState } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SuccessState from "./SuccessState";

export default function ForgotPasswordCard() {
  const [success, setSuccess] = useState(false);

  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {success ? (
          <SuccessState />
        ) : (
          <ForgotPasswordForm onSuccess={() => setSuccess(true)} />
        )}
      </div>
    </div>
  );
}