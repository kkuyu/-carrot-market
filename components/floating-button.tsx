import Link from "next/link";
import React from "react";

interface FloatingButton {
  children: React.ReactNode;
  href: string;
}

export default function FloatingButton({ children, href }: FloatingButton) {
  return (
    <div className="fixed bottom-0 left-0 w-full">
      <div className="relative mx-auto w-full max-w-xl">
        <Link href={href}>
          <a className="absolute bottom-20 right-0 flex items-center justify-center w-14 aspect-square text-white bg-orange-400 border-transparent transition-colors rounded-full shadow-xl hover:bg-orange-500">
            {children}
          </a>
        </Link>
      </div>
    </div>
  );
}
