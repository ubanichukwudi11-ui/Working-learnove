"use client";

import { useState } from "react";
import ForgotPasswordForm from "./ForgotPasswordForm";
import SuccessState from "./SuccessState";

export default function ForgotPasswordCard() {
  const [success, setSuccess] = useState(false);

  return (
    <div className="w-full">
      {success ? (
        <SuccessState />
      ) : (
        <ForgotPasswordForm onSuccess={() => setSuccess(true)} />
      )}
    </div>
  );
}