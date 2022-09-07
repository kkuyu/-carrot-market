import type { HTMLAttributes } from "react";

interface LabelsProps extends HTMLAttributes<HTMLLabelElement | HTMLSpanElement> {
  tag?: "label" | "span";
  text?: string;
  htmlFor: string;
}

const Labels = (props: LabelsProps) => {
  const { tag: Tag = "label", text, htmlFor, className = "", ...restProps } = props;

  return (
    <Tag className={`block text-base font-semibold text-gray-700 ${className}`} {...restProps}>
      {text}
    </Tag>
  );
};

export default Labels;
