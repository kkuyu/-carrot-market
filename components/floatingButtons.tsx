import { useRouter } from "next/router";
import Link from "next/link";
import React from "react";
// @libs
import useUser from "@libs/client/useUser";
import useModal from "@libs/client/useModal";
// @components
import MessageModal, { MessageModalProps } from "@components/commons/modals/case/messageModal";

interface FloatingButtonsProps {
  href: string;
  children: React.ReactNode;
}

const FloatingButtons = ({ href, children }: FloatingButtonsProps) => {
  const router = useRouter();
  const { type: userType } = useUser();
  const { openModal } = useModal();

  const openSignUpModal = () => {
    openModal<MessageModalProps>(MessageModal, "signUpNow", {
      type: "confirm",
      message: "휴대폰 인증하고 회원가입하시겠어요?",
      cancelBtn: "취소",
      confirmBtn: "회원가입",
      hasBackdrop: true,
      onConfirm: () => {
        router.push("/user/account/phone");
      },
    });
  };

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
            onClick={openSignUpModal}
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
