import { useRouter } from "next/router";
import Link from "next/link";
import React from "react";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
// @components
import RegisterModal, { RegisterModalProps, RegisterModalName } from "@components/commons/modals/case/registerModal";

interface FloatingButtonsProps extends React.HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {}

const FloatingButtons = (props: FloatingButtonsProps) => {
  const { className = "", ...restProps } = props;
  const router = useRouter();
  const { type: userType } = useUser();
  const { openModal } = useModal();

  const floatingButton = (options: { icon?: React.ReactNode; pathname?: string | null }) => {
    const icon = options?.icon || (
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    );
    const className = {
      button: "flex items-center justify-center w-12 h-12 text-white bg-orange-400 border-transparent pointer-events-auto transition-colors rounded-full drop-shadow-md hover:bg-orange-500",
    };
    if (userType !== "member" || !options?.pathname) {
      return (
        <button type="button" className={`${className.button} ${className}`} onClick={() => openModal<RegisterModalProps>(RegisterModal, RegisterModalName, {})} {...restProps}>
          {icon}
        </button>
      );
    }
    return (
      <Link href={options?.pathname}>
        <a className={`${className.button} ${className}`} {...restProps}>
          {icon}
        </a>
      </Link>
    );
  };

  return (
    <div className="fixed-container bottom-0 pointer-events-none">
      <div className="fixed-inner flex justify-end -translate-x-2 -translate-y-16">
        {floatingButton({
          pathname: router.pathname === "/" ? "/products/upload" : router.pathname === "/stories" ? "/stories/upload" : null,
        })}
      </div>
    </div>
  );
};

export default FloatingButtons;
