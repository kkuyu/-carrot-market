import type { HTMLAttributes } from "react";
import { useRef, useState, useEffect } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
// @libs
import { clearTimer, setTimer, TimerRef } from "@libs/utils";
import usePanel from "@libs/client/usePanel";
// @components
import BottomPanel, { BottomPanelProps, BottomSheetProps } from "@components/commons/panels/case/bottomPanel";

interface OptionGroupItem<T> {
  label: string;
  options: {
    value: T;
    text: string;
  }[];
}

interface SelectsProps<T> extends HTMLAttributes<HTMLSelectElement> {
  type?: "dropdown" | "bottomPanel";
  name: string;
  placeholder: string;
  initialValue: T;
  updateValue: (value: T) => void;
  optionGroups: OptionGroupItem<T>[];
  required?: boolean;
  register?: UseFormRegisterReturn;
}

const Selects = <T extends string | number>(props: SelectsProps<T>) => {
  const { type = "bottomPanel", name, placeholder, initialValue, updateValue, optionGroups, required = false, register, className = "", ...restProps } = props;
  const { openPanel, closePanel } = usePanel();

  const [isOpen, setIsOpen] = useState(false);
  const combobox = useRef<HTMLButtonElement>(null);
  const listbox = useRef<HTMLDivElement>(null);
  const delayTimer: TimerRef = useRef(null);

  const [currentValue, setCurrentValue] = useState<T>(() => initialValue);
  const currentText = optionGroups.flatMap((group) => group.options).find((option) => option.value === currentValue)?.text || placeholder;

  const toggleCombobox = () => {
    clearTimer(delayTimer);
    setIsOpen(!isOpen);
  };

  const toggleDropdown = async () => {
    await setTimer(delayTimer, 0);
    if (isOpen && listbox.current) {
      listbox.current.focus();
    }
    if (!isOpen && combobox.current) {
      combobox.current.focus();
    }
  };

  const toggleBottomPanel = async () => {
    if (isOpen) {
      const BottomSheet = ({ ...props }: BottomSheetProps) => {
        const { closeBottomPanel } = props;
        return (
          <>
            <strong>{placeholder}</strong>
            <Listbox
              lists={optionGroups}
              selectItem={async (item) => {
                updateValue(item.value);
                setCurrentValue(item.value);
                if (closeBottomPanel) await closeBottomPanel();
              }}
              className="[&>button]:py-1"
            />
          </>
        );
      };
      openPanel<BottomPanelProps>(BottomPanel, "selectBottomPanel", {
        children: <BottomSheet />,
        closePanel: () => setIsOpen(false),
      });
    }
    if (!isOpen) {
      closePanel(BottomPanel, "selectBottomPanel");
    }
  };

  const Listbox = (props: { lists: OptionGroupItem<T>[]; selectItem: (item: OptionGroupItem<T>["options"][0]) => void } & HTMLAttributes<HTMLDivElement>) => {
    const { lists, selectItem, className: listboxClassName = "", ...restProps } = props;
    const Option = (props: { item: OptionGroupItem<T>["options"][0] } & HTMLAttributes<HTMLButtonElement>) => (
      <button role="option" type="button" onClick={() => selectItem(props.item)} className="w-full text-left hover:font-semibold" aria-selected={props.item.value === currentValue}>
        {props.item.text}
      </button>
    );
    return (
      <div ref={listbox} role="listbox" className={`${listboxClassName}`} {...restProps}>
        {lists.map((list, index) => {
          if (lists.length === 1) return list.options.map((item) => <Option key={item.value} item={item} />);
          return (
            <div key={list.label} role="group" aria-labelledby={`${name}-${index}`}>
              <span role="presentation" id={`${name}-${index}`}>
                {list.label}
              </span>
              {list.options.map((item) => (
                <Option key={item.value} item={item} />
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    if (type === "dropdown") toggleDropdown();
    if (type === "bottomPanel") toggleBottomPanel();
  }, [isOpen]);

  return (
    <div className="relative">
      {/* custom combobox */}
      <button
        ref={combobox}
        type="button"
        id={name}
        onClick={toggleCombobox}
        className={`relative w-full px-3 py-2 text-left border rounded-md outline-none
        ${isOpen ? "border-orange-500 shadow-[0_0_0_1px_rgba(249,115,22,1)]" : "border-gray-300"}
        ${isOpen ? "focus:border-orange-800 focus:shadow-[0_0_0_1px_rgba(194,65,11,1)]" : "focus:border-orange-500 focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]"}
        ${className}`}
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="listbox"
      >
        <span className={`${currentValue ? "text-black" : "text-gray-500"}`}>{currentText}</span>
        <span className={`absolute top-1/2 right-3 -mt-3 ${isOpen ? "rotate-180" : "rotate-0"}`} aria-hidden="true">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </span>
      </button>

      {/* custom dropdown */}
      {type === "dropdown" && isOpen && (
        <div className="mt-3">
          <Listbox
            lists={optionGroups}
            selectItem={(item) => {
              updateValue(item.value);
              setCurrentValue(item.value);
              setIsOpen(false);
            }}
            className="max-h-28 py-2 border border-gray-300 rounded-md overflow-y-scroll focus:outline focus:outline-1 [&>button]:px-3 [&>button]:py-0.5"
            tabIndex={0}
          />
        </div>
      )}

      {/* original select */}
      <select className="hidden" {...register} name={name} required={required} {...restProps}>
        {optionGroups.map((group) => {
          if (optionGroups.length === 1)
            return group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.text}
              </option>
            ));
          return (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </div>
  );
};

export default Selects;
