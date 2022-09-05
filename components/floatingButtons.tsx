import { useRouter } from "next/router";
import Link from "next/link";
import type { HTMLAttributes, ReactElement } from "react";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
// @components
import RegisterAlertModal, { RegisterAlertModalProps, RegisterAlertModalName } from "@components/commons/modals/instance/registerAlertModal";
import Buttons from "@components/buttons";
import Icons from "@components/icons";

interface FloatingButtonsProps extends HTMLAttributes<HTMLButtonElement | HTMLAnchorElement> {}

const FloatingButtons = (props: FloatingButtonsProps) => {
  const { className = "", ...restProps } = props;
  const router = useRouter();
  const { type: userType } = useUser();
  const { openModal } = useModal();

  const CustomIconButton = (buttonProps: { pathname: string | null; children: ReactElement } & HTMLAttributes<HTMLButtonElement | HTMLAnchorElement>) => {
    const { pathname, onClick, className: buttonClassName = "", children, ...buttonRestProps } = buttonProps;
    if (!pathname) {
      return (
        <Buttons tag="button" type="button" sort="icon-block" size="lg" status="primary" onClick={onClick} className={`${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      );
    }
    return (
      <Link href={pathname} passHref>
        <Buttons tag="a" sort="icon-block" size="lg" status="primary" className={`${buttonClassName}`} {...buttonRestProps}>
          {children}
        </Buttons>
      </Link>
    );
  };

  return (
    <div className="fixed-container bottom-0 pointer-events-none">
      <div className="fixed-inner flex justify-end -translate-x-2 -translate-y-16">
        <CustomIconButton
          pathname={userType === "member" ? (router.pathname === "/" ? "/products/upload" : router.pathname === "/stories" ? "/stories/upload" : null) : null}
          onClick={() => openModal<RegisterAlertModalProps>(RegisterAlertModal, RegisterAlertModalName, {})}
          className={`pointer-events-auto ${className} rounded-full`}
          {...restProps}
        >
          <Icons name="Plus" className="w-6 h-6 text-white" />
        </CustomIconButton>
      </div>
    </div>
  );
};

export default FloatingButtons;
