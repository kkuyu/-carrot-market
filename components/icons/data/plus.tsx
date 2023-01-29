import type { SVGAttributes } from "react";

export function Plus(props: SVGAttributes<SVGElement>) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={2.0} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
