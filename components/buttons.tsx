import type { ForwardedRef, ReactElement, ReactNode, ElementType } from "react";
import { forwardRef } from "react";

type As = "button" | "a";
type Element<T extends As> = T extends "a" ? HTMLAnchorElement : HTMLButtonElement;
type Props<T extends keyof JSX.IntrinsicElements> = {
  tag: "button" | "a";
  sort?: "round-box" | "text-link" | "icon-block";
  size?: "sm" | "base" | "lg";
  status?: "primary" | "default" | "danger" | "unset";
  text: string | ReactElement | ReactNode;
  disabled?: boolean;
} & JSX.IntrinsicElements[T];

const Buttons = <Tag extends As = "button">(props: Props<Tag>, ref?: ForwardedRef<Element<Tag>>) => {
  const { tag: TagName = "button", sort = "round-box", status = "primary", size = "base", text, className = "", ...restProps } = props;

  const { type, disabled, ...refineProps } = restProps;
  const optionalProps = { ...(TagName === "a" && {}), ...(TagName === "button" && { type, disabled }) };

  const Component = TagName as ElementType;
  const classNames = {
    "round-box": {
      basic: "block w-full px-4 font-semibold text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
      sm: "py-1.5 text-sm",
      base: "py-[0.33rem] text-base",
      lg: "text-lg",
      primary: "text-white bg-orange-500 border-transparent hover:bg-orange-600 focus:ring-orange-500",
      default: "text-black bg-white border border-gray-300 hover:border-gray-500 focus:ring-gray-300",
      danger: "text-red-600 bg-red-100 border border-red-300 hover:border-red-500 focus:ring-red-300",
      unset: "border-none",
    },
    "text-link": {
      basic: "inline-block px-1 font-semibold text-left",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      primary: "text-orange-500",
      default: "font-normal underline",
      danger: "text-red-500",
      unset: "px-0 font-normal",
    },
    "icon-block": {
      basic: "flex items-center justify-center rounded-md",
      sm: "w-7 h-7",
      base: "w-10 h-10",
      lg: "w-12 h-12",
      primary: "text-white bg-orange-500 border-transparent hover:bg-orange-600",
      default: "text-gray-500 hover:bg-black hover:bg-opacity-[0.15] focus:bg-black focus:bg-opacity-[0.15]",
      danger: "text-red-500 hover:bg-red-200 focus:bg-red-200",
      unset: "",
    },
  };

  return (
    <Component ref={ref} {...optionalProps} {...refineProps} className={`${classNames[sort].basic} ${classNames[sort][size]} ${classNames[sort][status]} ${disabled ? "opacity-60" : ""} ${className}`}>
      {text}
    </Component>
  );
};

export default forwardRef(Buttons);
