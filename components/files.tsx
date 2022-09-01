import { useEffect, useState } from "react";
import Image from "next/image";
import type { HTMLAttributes, ChangeEvent, SyntheticEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
// @libs
import { convertFiles, validateFiles, FileOptions } from "@libs/utils";
import useToast from "@libs/client/useToast";
// @components
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";
import Icons from "@components/icons";

interface PreviewItem {
  src: string;
  raw: File;
}

interface FilesProps extends HTMLAttributes<HTMLInputElement> {
  name: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  register?: UseFormRegisterReturn;
  fileOptions?: FileOptions;
  initialValue?: string;
  updateValue?: (value: FileList) => void;
}

const Files = (props: FilesProps) => {
  const { name, required = false, disabled, accept, multiple = false, register, fileOptions, initialValue, updateValue, className = "", ...restProps } = props;
  const { openToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [previewList, setPreviewList] = useState<PreviewItem[]>([]);
  const [currentValues, setCurrentValues] = useState<FileList>();

  const errorPreview = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    img?.setAttribute("class", "error-image");
    openToast<MessageToastProps>(MessageToast, "InvalidImage", {
      placement: "bottom",
      message: "이미지 파일을 다시 확인해주세요",
    });
  };

  const updatePreview = () => {
    // empty
    if (!currentValues || !currentValues?.length) {
      return setPreviewList([]);
    }
    // update preview
    setPreviewList(
      Array.from(currentValues).map((file: File) => ({
        src: URL.createObjectURL(file),
        raw: file,
      }))
    );
  };

  const updateInitialFiles = async () => {
    // empty
    if (!initialValue || !initialValue.length) {
      setIsLoading(false);
      return;
    }
    // initial files
    const { validFiles } = await convertFiles(initialValue.split(";"));
    // update value
    if (updateValue) updateValue(validFiles);
    setCurrentValues(validFiles);
    setIsLoading(false);
  };

  const updateInputFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    // empty
    if (!e.target.files || !e.target.files.length) return;
    // concat files
    const transfer = new DataTransfer();
    const files = !multiple ? [...Array.from(e.target.files || [])] : [...Array.from(currentValues || []), ...Array.from(e.target.files || [])];
    files.forEach((file) => transfer.items.add(file));
    // valid files
    const { errors, validFiles } = await validateFiles(transfer.files, fileOptions);
    errors.map((error) => {
      openToast<MessageToastProps>(MessageToast, `InvalidFile_${error.type}`, {
        placement: "bottom",
        message: error.message,
      });
    });
    // update value
    if (updateValue) updateValue(validFiles);
    setCurrentValues(transfer.files);
  };

  const removeFiles = (item: PreviewItem) => {
    // empty
    if (!currentValues || !currentValues?.length) return;
    // filter files
    const transfer = new DataTransfer();
    const files = Array.from(currentValues).filter((file) => file.name !== item.raw?.name);
    files.forEach((file) => transfer.items.add(file));
    // update value
    if (updateValue) updateValue(transfer.files);
    setCurrentValues(transfer.files);
  };

  useEffect(() => {
    updatePreview();
  }, [currentValues]);

  useEffect(() => {
    updateInitialFiles();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 left-0">
        <input
          id={name}
          type="file"
          name={name}
          required={required}
          disabled={disabled || isLoading}
          accept={accept}
          multiple={multiple}
          className="peer sr-only"
          {...restProps}
          onChange={updateInputFiles}
        />
        <label
          htmlFor={name}
          className="relative flex flex-col items-center justify-center w-20 h-20 bg-white border border-gray-300 rounded-md
          peer-focus:outline-none peer-focus:border-orange-500 peer-focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]"
        >
          <Icons name="Photo" className="w-5 h-5 text-gray-500" />
          <span className="mt-1 text-sm">
            <em className={`not-italic ${previewList.length > 0 ? "text-orange-500" : ""}`}>{previewList.length}</em>
            {fileOptions?.maxLength ? `/${fileOptions?.maxLength}` : ""}
          </span>
        </label>
      </div>
      <div className="flex pl-20 pt-2 overflow-x-scroll before:block before:h-20">
        {previewList?.map((item, index, array) => (
          <div key={item.src} className="relative ml-3 w-20 shrink-0">
            <div className="relative border border-gray-300 rounded-md overflow-hidden">
              <span className="block pb-[100%]"></span>
              <Image src={item.src} alt="" layout="fill" objectFit="cover" className="bg-slate-300 rounded-md" onError={errorPreview} />
              {index === 0 && <span className="absolute bottom-0 left-0 w-full text-sm text-center text-white bg-black">대표 사진</span>}
            </div>
            <button
              type="button"
              onClick={() => removeFiles(item)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 rounded-full hover:bg-black focus:bg-black"
              aria-label={`${index}/${array.length} 이미지 삭제`}
            >
              <Icons name="XMark" className="m-auto w-4 h-4 text-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Files;
