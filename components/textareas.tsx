import { UseFormRegisterReturn } from "react-hook-form";

interface TextAreasProps extends React.HTMLAttributes<HTMLTextAreaElement> {
  name?: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  [key: string]: any;
}

const TextAreas = ({ name, required = false, register, ...rest }: TextAreasProps) => {
  return (
    <textarea
      id={name}
      className="w-full border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-orange-500 focus:border-orange-500"
      rows={4}
      required={required}
      {...register}
      {...rest}
    />
  );
};

export default TextAreas;
