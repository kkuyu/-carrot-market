import React, { ReactNode } from "react";

import { cls } from "@libs/utils";

type Props<Tag extends keyof JSX.IntrinsicElements> = {
  tag: "a" | "button";
  sort?: "round-box" | "text-link";
  status?: "primary" | "default" | "danger";
  size?: "sm" | "base";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  text: string;
  icon?: ReactNode;
  [key: string]: any;
} & JSX.IntrinsicElements[Tag];

const Buttons = <Tag extends keyof JSX.IntrinsicElements>({ tag: TagName = "button", sort = "round-box", status = "primary", size = "sm", text, icon, className, ...props }: Props<Tag>) => {
  const { type, disabled, ...rest } = props;
  const optionalProps = {
    ...(TagName === "a" && {}),
    ...(TagName === "button" && { type, disabled }),
  };
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
      <TagName
        {...optionalProps}
        {...rest}
        className="flex items-center justify-center w-10 h-10 text-gray-400 rounded-md outline-none hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500"
      >
        {icon}
        {text ? <span className="sr-only">{text}</span> : null}
      </TagName>
    );
  }

  return (
    <TagName {...optionalProps} {...rest} className={cls(`${className}`, classNames[sort].basic, classNames[sort][size], classNames[sort][status], disabled ? "opacity-60" : "")}>
      {text}
    </TagName>
  );
};

export default Buttons;
