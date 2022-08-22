import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes } from "react";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
// @components
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Icons from "@components/icons";

interface FloatingButtonsProps extends HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {}

const FloatingButtons = (props: FloatingButtonsProps) => {
  const { className = "", ...restProps } = props;
  const router = useRouter();
  const { type: userType } = useUser();
  const { openModal } = useModal();

  const IconButton = (buttonProps: { pathname: string | null } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...buttonRestProps } = buttonProps;
    if (!pathname) {
      return (
        <button type="button" onClick={onClick} className={`${buttonClassName}`} {...buttonRestProps}>
          {children}
        </button>
      );
    }
    return (
      <Link href={pathname} passHref>
        <a className={`${buttonClassName}`} {...buttonRestProps}>
          {children}
        </a>
      </Link>
    );
  };

  return (
    <div className="fixed-container bottom-0 pointer-events-none">
      <div className="fixed-inner flex justify-end -translate-x-2 -translate-y-16">
        <IconButton
          pathname={userType === "member" ? (router.pathname === "/" ? "/products/upload" : router.pathname === "/stories" ? "/stories/upload" : null) : null}
          onClick={() => openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {})}
          className={`pointer-events-auto ${className}`}
          {...restProps}
        >
          <span className="flex items-center justify-center w-12 h-12 bg-orange-400 rounded-full">
            <Icons name="Plus" className="w-6 h-6 text-white" />
          </span>
        </IconButton>
      </div>
    </div>
  );
};

export default FloatingButtons;
