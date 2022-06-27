import React, { ForwardedRef, ReactNode } from "react";

import { cls } from "@libs/utils";

type As = "button" | "a";
type Element<T extends As> = T extends "a" ? HTMLAnchorElement : HTMLButtonElement;
type Props<T extends keyof JSX.IntrinsicElements> = {
  tag: "button" | "a";
  sort?: "round-box" | "text-link";
  status?: "primary" | "default" | "danger";
  size?: "sm" | "base";
  text: string;
  icon?: ReactNode;
  [key: string]: any;
} & JSX.IntrinsicElements[T];

const Buttons = <Tag extends As = "button">(props: Props<Tag>, ref?: ForwardedRef<Element<Tag>>) => {
  const { tag: TagName = "button", sort = "round-box", status = "primary", size = "sm", text, icon, className, ...rest } = props;
  const { type, disabled, ...refineProps } = rest;
  const optionalProps = {
    ...(TagName === "a" && {}),
    ...(TagName === "button" && { type, disabled }),
  };

  const Component = TagName as React.ElementType;
  const classNames = {
    "round-box": {
      basic: "block w-full px-4 font-semibold border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2",
      sm: "py-2 text-sm",
      base: "py-3 text-base",
      primary: "text-white bg-orange-500 border-transparent hover:bg-orange-600 focus:ring-orange-500",
      default: "text-black bg-white border border-gray-300 hover:border-gray-500 focus:ring-gray-300",
      danger: "text-red-600 bg-red-100 border border-red-300 hover:border-red-500 focus:ring-red-300",
    },
    "text-link": {
      basic: "px-1 font-semibold",
      sm: "text-sm",
      base: "text-base",
      primary: "text-orange-500",
      default: "text-black font-normal underline",
      danger: "text-red-500",
    },
  };

  if (icon) {
    return (
      <Component
        ref={ref}
        {...optionalProps}
        {...refineProps}
        className="flex items-center justify-center w-10 h-10 text-gray-400 rounded-md outline-none hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500"
      >
        {icon}
        {text ? <span className="sr-only">{text}</span> : null}
      </Component>
    );
  }

  return (
    <Component ref={ref} {...optionalProps} {...refineProps} className={cls(`${className}`, classNames[sort].basic, classNames[sort][size], classNames[sort][status], disabled ? "opacity-60" : "")}>
      {text}
    </Component>
  );
};

export default React.forwardRef(Buttons);
