import type { ForwardedRef, ReactElement } from "react";
import { forwardRef, useMemo } from "react";

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

  // variable: invisible
  const Component = `${TagName}`;
  const { type, disabled, ...refineProps } = restProps;
  const optionalProps = { ...(TagName === "a" && {}), ...(TagName === "button" && { type, disabled }) };

  // variable: styles
  const classNamesByRoundBox = useMemo(() => {
    let classNames = "block px-4 font-semibold text-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 [&:not(.w-auto)]:w-full ";
    if (size === "sm") classNames += " px-3 py-1 text-sm ";
    if (size === "base") classNames += "py-[0.33rem] text-base ";
    if (size === "lg") classNames += "text-lg ";
    if (status === "primary") classNames += "text-white bg-orange-500 border border-transparent hover:bg-orange-600 focus:ring-orange-500 ";
    if (status === "default") classNames += "text-black bg-white border border-gray-300 hover:border-gray-500 focus:ring-gray-300 ";
    if (status === "danger") classNames += "text-red-600 bg-red-100 border border-red-300 hover:border-red-500 focus:ring-red-300 ";
    if (status === "unset") classNames += "";
    return classNames;
  }, [status, size]);

  const classNamesByIconBlock = useMemo(() => {
    let classNames = "flex items-center justify-center rounded-md ";
    if (size === "sm") classNames += "w-7 h-7 ";
    if (size === "base") classNames += "w-10 h-10 ";
    if (size === "lg") classNames += "w-12 h-12 ";
    if (status === "primary") classNames += "text-white bg-orange-500 border-transparent hover:bg-orange-600 ";
    if (status === "default") classNames += "text-gray-500 hover:bg-black hover:bg-opacity-[0.15] focus:bg-black focus:bg-opacity-[0.15] ";
    if (status === "danger") classNames += "text-red-500 hover:bg-red-200 focus:bg-red-200 ";
    if (status === "unset") classNames += "";
    return classNames;
  }, [status, size]);

  const classNamesByTextLink = useMemo(() => {
    let classNames = "inline-block text-left ";
    if (size === "sm") classNames += "text-sm ";
    if (size === "base") classNames += "text-base ";
    if (size === "lg") classNames += "text-lg ";
    if (status === "primary") classNames += "px-1 font-semibold text-orange-500 ";
    if (status === "default") classNames += "px-1 underline ";
    if (status === "danger") classNames += "px-1 font-semibold text-red-500 ";
    if (status === "unset") classNames += "";
    return classNames;
  }, [status, size]);

  return (
    <Component
      ref={ref}
      {...optionalProps}
      {...refineProps}
      className={`
        ${sort === "round-box" ? classNamesByRoundBox : sort === "icon-block" ? classNamesByIconBlock : sort === "text-link" ? classNamesByTextLink : ""}
        ${disabled ? "opacity-60" : ""} ${className}
      `}
    >
      {children}
    </Component>
  );
};

export default forwardRef(Buttons);
