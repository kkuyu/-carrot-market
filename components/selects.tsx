import type { HTMLAttributes } from "react";
import { useRef, useState, useEffect } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface OptionItem {
  value: string;
  text: string;
}

interface SelectsProps extends HTMLAttributes<HTMLSelectElement> {
  name: string;
  options: OptionItem[];
  currentValue: string;
  updateValue: (name: string, value: string) => void;
  required?: boolean;
  register?: UseFormRegisterReturn;
}

const Selects = (props: SelectsProps) => {
  const { name, options, currentValue = "", updateValue, required = false, register, className = "", ...restProps } = props;

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  const currentText = options.find((option) => option.value === currentValue)?.text;
  const combobox = useRef<HTMLButtonElement>(null);
  const listbox = useRef<HTMLDivElement>(null);

  const selectItem = (item: OptionItem) => {
    updateValue(name, item.value);
    setOpen(false);
  };

  useEffect(() => {
    if (!mounted) return;
    if (open && listbox.current) {
      listbox.current.scrollTop = 0;
      listbox.current.focus();
    }
    if (!open && combobox.current) {
      combobox.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative">
      {/* custom select: combobox */}
      <button
        ref={combobox}
        type="button"
        id={name}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative w-full px-3 py-2 text-left border rounded-md outline-none
        ${open ? "border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,1)]" : "border-gray-300"}
        ${open ? "focus:border-orange-800 focus:shadow-[0_0_0_1px_rgba(194,65,11,1)]" : "focus:border-orange-500 focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]"}
        ${className}`}
        aria-expanded={open ? "true" : "false"}
        aria-haspopup="listbox"
      >
        <span className={`${currentValue ? "text-black" : "text-gray-500"}`}>{currentText}</span>
        <span className={`absolute top-1/2 right-3 -mt-3 ${open ? "rotate-180" : "rotate-0"}`} aria-hidden="true">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </span>
      </button>

      {/* custom select: listbox */}
      <div ref={listbox} role="listbox" className={`${open ? "block" : "hidden"} mt-3 max-h-28 pt-2 pb-2 border border-gray-300 rounded-md overflow-y-scroll`} tabIndex={0}>
        {options
          .filter((v) => v.value)
          .map((option) => {
            return (
              <button
                key={option.value}
                role="option"
                type="button"
                onClick={() => selectItem(option)}
                className={`w-full text-left px-3 py-1 hover:font-semibold ${option.value === currentValue ? "font-semibold" : ""}`}
                aria-selected={option.value === currentValue}
              >
                {option.text}
              </button>
            );
          })}
      </div>

      {/* original select */}
      <select className="hidden" {...register} name={name} required={required} {...restProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.text}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Selects;
