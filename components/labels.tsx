import { cls } from "@libs/utils";
import React, { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

interface LabelsProps extends React.HTMLAttributes<HTMLLabelElement> {
  text?: string;
  htmlFor: string;
  [key: string]: any;
}

const Labels = ({ text, htmlFor, ...rest }: LabelsProps) => {
  return (
    <label className="block text-sm font-semibold text-gray-700" htmlFor={htmlFor} {...rest}>
      {text}
    </label>
  );
};

export default Labels;
