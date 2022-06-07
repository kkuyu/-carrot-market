import { UseFormRegisterReturn } from "react-hook-form";

interface TextAreaProps {
  label?: string;
  name?: string;
  register?: UseFormRegisterReturn;
  [key: string]: any;
}

export default function TextArea({ label, name, register, ...rest }: TextAreaProps) {
  return (
    <div className="space-y-1">
      {label ? (
        <label htmlFor={name} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      ) : null}
      <textarea
        id={name}
        className="w-full border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-orange-500 focus:border-orange-500"
        rows={4}
        {...register}
        {...rest}
      />
    </div>
  );
}
