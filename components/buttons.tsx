import React, { ForwardedRef, ReactNode } from "react";

type As = "button" | "a";
type Element<T extends As> = T extends "a" ? HTMLAnchorElement : HTMLButtonElement;
type Props<T extends keyof JSX.IntrinsicElements> = {
  tag: "button" | "a";
  sort?: "round-box" | "text-link" | "icon-block";
  size?: "sm" | "base";
  status?: "primary" | "default" | "danger" | "unset";
  text: string | ReactNode;
  [key: string]: any;
} & JSX.IntrinsicElements[T];

const Buttons = <Tag extends As = "button">(props: Props<Tag>, ref?: ForwardedRef<Element<Tag>>) => {
  const { tag: TagName = "button", sort = "round-box", status = "primary", size = "base", text, className, ...rest } = props;
  const { type, disabled, ...refineProps } = rest;
  const optionalProps = {
    ...(TagName === "a" && {}),
    ...(TagName === "button" && { type, disabled }),
  };

  const Component = TagName as React.ElementType;
  const classNames = {
    "round-box": {
      basic: "block w-full px-4 font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
      sm: "py-2 text-sm",
      base: "py-2 text-base",
      primary: "text-white bg-orange-500 border-transparent hover:bg-orange-600 focus:ring-orange-500",
      default: "text-black bg-white border border-gray-300 hover:border-gray-500 focus:ring-gray-300",
      danger: "text-red-600 bg-red-100 border border-red-300 hover:border-red-500 focus:ring-red-300",
      unset: "border-none",
    },
    "text-link": {
      basic: "px-1 font-semibold",
      sm: "text-sm",
      base: "text-base",
      primary: "text-orange-500",
      default: "text-black font-normal underline",
      danger: "text-red-500",
      unset: "",
    },
    "icon-block": {
      basic: "flex items-center justify-center rounded-md",
      sm: "w-8 h-8",
      base: "w-10 h-10",
      primary: "text-white bg-orange-500 border-transparent hover:bg-orange-600",
      default: "text-gray-500 hover:bg-gray-200 focus:bg-gray-200",
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

export default React.forwardRef(Buttons);
