import Image from "next/image";
import React, { ChangeEvent, useEffect, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
// @libs
import { FileOptions, validateFiles } from "@libs/utils";
import useToast from "@libs/client/useToast";
// @components
import MessageToast, { MessageToastProps } from "@components/commons/toasts/case/messageToast";

interface PreviewItem {
  src: string;
  raw: File;
}

interface FilesProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  required?: boolean;
  disabled?: boolean;
  fileOptions?: FileOptions;
  currentFiles?: FileList;
  changeFiles?: (value: FileList) => void;
  accept?: string;
  multiple?: boolean;
  register?: UseFormRegisterReturn;
  [key: string]: any;
}

const Files = ({ name, required = false, disabled, fileOptions, currentFiles, changeFiles, accept, multiple = false, register, ...rest }: FilesProps) => {
  const [preview, setPreview] = useState<PreviewItem[]>([]);

  const { openToast } = useToast();

  const updatePreview = () => {
    // empty
    if (!currentFiles || !currentFiles?.length) {
      return setPreview([]);
    }
    // set thumbnails
    setPreview(
      Array.from(currentFiles).map((file: File) => ({
        src: URL.createObjectURL(file),
        raw: file,
      }))
    );
  };

  const removeFiles = (item: PreviewItem) => {
    // empty
    if (!currentFiles || !currentFiles?.length) return;
    // filter files
    const transfer = new DataTransfer();
    const filterFiles = Array.from(currentFiles).filter((file) => file.name !== item.raw?.name);
    filterFiles.forEach((file) => transfer.items.add(file));
    // update hook form value
    if (changeFiles) changeFiles(transfer.files);
  };

  const onChangeInput = (e: ChangeEvent<HTMLInputElement>) => {
    // empty
    if (!e.target.files || !e.target.files.length) return;
    // concat files
    const transfer = new DataTransfer();
    const newFiles = !multiple ? [...Array.from(e.target.files || [])] : [...Array.from(currentFiles || []), ...Array.from(e.target.files || [])];
    newFiles.forEach((file) => transfer.items.add(file));
    // check options
    const { errors, validFiles } = validateFiles(transfer.files, fileOptions);
    errors.map((error) => {
      openToast<MessageToastProps>(MessageToast, `InvalidFile_${error.type}`, {
        placement: "bottom",
        message: error.message,
      });
    });
    // update hook form value
    if (changeFiles) changeFiles(validFiles);
  };

  const onErrorImage = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    img?.setAttribute("class", "error-image");
    openToast<MessageToastProps>(MessageToast, "InvalidImage", {
      placement: "bottom",
      message: `이미지를 확인해주세요.`,
    });
  };

  useEffect(() => {
    updatePreview();
  }, [currentFiles]);

  return (
    <div className="relative">
      <div className="absolute top-2 left-0">
        <input id={name} type="file" name={name} required={required} disabled={disabled} accept={accept} multiple={multiple} className="peer sr-only" {...rest} onChange={onChangeInput} />
        <label
          htmlFor={name}
          className="relative flex flex-col items-center justify-center w-20 h-20 bg-white border border-gray-300 rounded-md
            peer-focus:outline-none peer-focus:border-orange-500 peer-focus:shadow-[0_0_0_1px_rgba(249,115,22,1)]"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            ></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span className="mt-1 text-sm">
            <em className={`not-italic ${preview.length > 0 ? "text-orange-500" : ""}`}>{preview.length}</em>
            {fileOptions?.maxLength ? `/${fileOptions?.maxLength}` : ""}
          </span>
        </label>
      </div>
      <div className="flex pl-20 pt-2 overflow-x-scroll before:block before:h-20">
        {preview?.map((item, index) => (
          <div key={item.src} className="relative ml-3 w-20 shrink-0">
            <div className="relative border border-gray-300 rounded-md overflow-hidden">
              <span className="block pb-[100%]"></span>
              <Image src={item.src} alt="" layout="fill" objectFit="cover" className="bg-slate-300 rounded-md" onError={onErrorImage} />
              {index === 0 && <span className="absolute bottom-0 left-0 w-full text-sm text-center text-white bg-black">대표 사진</span>}
            </div>
            <button type="button" className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 rounded-full outline-none hover:bg-black focus:bg-black" onClick={() => removeFiles(item)}>
              <svg className="m-auto w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Files;
