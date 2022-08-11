import React from "react";

interface LabelsProps extends React.HTMLAttributes<HTMLLabelElement | HTMLSpanElement> {
  tag?: "label" | "span";
  text?: string;
  htmlFor: string;
}

const Labels = (props: LabelsProps) => {
  const { tag: Tag = "label", text, htmlFor, className = "", ...restProps } = props;

  return (
    <Tag
      onClick={() => {
        if (props.tag === "label") return;
        const targetEl = document.querySelector(`#${htmlFor}`) as HTMLElement;
        targetEl?.focus();
      }}
      className={`block text-base font-semibold text-gray-700 ${props.tag === "label" ? "" : "cursor-pointer"} ${className}`}
      {...restProps}
    >
      {text}
    </Tag>
  );
};

export default Labels;
