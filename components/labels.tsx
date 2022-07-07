import React from "react";

interface LabelsProps extends React.HTMLAttributes<HTMLLabelElement> {
  tag?: "label" | "span";
  text?: string;
  htmlFor: string;
  [key: string]: any;
}

const Labels = ({ tag = "label", text, htmlFor, ...rest }: LabelsProps) => {
  if (tag === "span") {
    return (
      <span
        className="block text-base font-semibold text-gray-700 cursor-pointer"
        {...rest}
        onClick={() => {
          const targetEl = document.querySelector(`#${htmlFor}`) as HTMLElement;
          targetEl?.focus();
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <label className="block text-base font-semibold text-gray-700" htmlFor={htmlFor} {...rest}>
      {text}
    </label>
  );
};

export default Labels;
