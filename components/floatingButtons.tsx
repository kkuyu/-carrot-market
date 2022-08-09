import Link from "next/link";
import React from "react";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
// @components
import RegisterModal, { RegisterModalProps, RegisterModalName } from "@components/commons/modals/case/registerModal";

interface FloatingButtonsProps {
  href: string;
  children: React.ReactNode;
}

const FloatingButtons = ({ href, children }: FloatingButtonsProps) => {
  const { type: userType } = useUser();
  const { openModal } = useModal();

  return (
    <div className="fixed-container bottom-0">
      <div className="fixed-inner">
        {userType === "member" ? (
          <Link href={href}>
            <a className="absolute bottom-20 right-4 flex items-center justify-center w-14 aspect-square text-white bg-orange-400 border-transparent transition-colors rounded-full shadow-xl hover:bg-orange-500">
              {children}
            </a>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {})}
            className="absolute bottom-20 right-4 flex items-center justify-center w-14 aspect-square text-white bg-orange-400 border-transparent transition-colors rounded-full shadow-xl hover:bg-orange-500"
          >
            {children}
          </button>
        )}
      </div>
    </div>
  );
};

export default FloatingButtons;
