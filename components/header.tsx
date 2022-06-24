import { useRouter } from "next/router";

interface HeaderProps {
  hasBackBtn?: boolean;
  title?: string;
}

export default function Header({ hasBackBtn, title }: HeaderProps) {
  const router = useRouter();

  const goBack = () => {
    router.back();
  };

  return (
    <header className="fixed top-0 left-0 w-full z-100">
      <div className="mx-auto w-full max-w-xl bg-white border-b">
        <div className="relative flex items-center justify-center w-full h-12">
          {hasBackBtn ? (
            <button className="absolute top-1/2 left-0 -translate-y-1/2 p-3" onClick={goBack}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
          ) : null}
          {title ? <strong className="block px-11 text-base font-semibold text-ellipsis overflow-hidden whitespace-nowrap">{title}</strong> : null}
        </div>
      </div>
    </header>
  );
}
