"use client";

import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/images/logo.png"
        alt="Learnova"
        width={180}
        height={50}
        priority
      />
    </Link>
  );
}