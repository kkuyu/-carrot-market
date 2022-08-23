import type { ForwardedRef, ReactElement } from "react";
import { forwardRef } from "react";

type As = Extract<keyof JSX.IntrinsicElements, "button" | "a">;
type Element<T extends As> = T extends "a" ? HTMLAnchorElement : HTMLButtonElement;

export type ButtonsProps<T extends keyof JSX.IntrinsicElements> = {
  tag: "button" | "a";
  sort?: "round-box" | "text-link" | "icon-block";
  size?: "sm" | "base" | "lg";
  status?: "primary" | "default" | "danger" | "unset";
  disabled?: boolean;
  children?: string | ReactElement | ReactElement[];
} & JSX.IntrinsicElements[T];

const Buttons = <Tag extends As>(props: ButtonsProps<Tag>, ref?: ForwardedRef<Element<Tag>>) => {
  const { tag: TagName = "button", sort = "round-box", status = "primary", size = "base", children, className = "", ...restProps } = props;

  const Component = `${TagName}`;
  const { type, disabled, ...refineProps } = restProps;
  const optionalProps = { ...(TagName === "a" && {}), ...(TagName === "button" && { type, disabled }) };

  const classNames = {
    "round-box": {
      basic: "block w-full px-4 font-semibold text-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
      sm: "px-3 py-1 text-sm",
      base: "py-[0.33rem] text-base",
      lg: "text-lg",
      primary: "text-white bg-orange-500 border border-transparent hover:bg-orange-600 focus:ring-orange-500",
      default: "text-black bg-white border border-gray-300 hover:border-gray-500 focus:ring-gray-300",
      danger: "text-red-600 bg-red-100 border border-red-300 hover:border-red-500 focus:ring-red-300",
      unset: "",
    },
    "text-link": {
      basic: "inline-block text-left",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      primary: "px-1 font-semibold text-orange-500",
      default: "px-1 font-semibold font-normal underline",
      danger: "px-1 font-semibold text-red-500",
      unset: "",
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
      {children}
    </Component>
  );
};

export default forwardRef(Buttons);
