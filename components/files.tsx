import Image from "next/image";

import React from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export interface Thumbnail {
  preview: string;
  raw: File;
}

export type UpdateFiles = (type: "remove", thumb?: Thumbnail) => void;

interface FilesProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  required?: boolean;
  disabled?: boolean;
  accept?: string;
  maxLength?: number;
  multiple?: boolean;
  register?: UseFormRegisterReturn;
  thumbnails: Thumbnail[];
  updateFiles: UpdateFiles;
  [key: string]: any;
}

const Files = ({ name, required = false, disabled, accept, maxLength, multiple = false, register, thumbnails, updateFiles, ...rest }: FilesProps) => {
  return (
    <div className="relative">
      <div className="absolute top-2 left-0">
        <input {...register} id={name} type="file" name={name} required={required} disabled={disabled} accept={accept} multiple={multiple} className="peer sr-only" {...rest} />
        <label htmlFor={name} className="relative flex flex-col items-center justify-center w-20 h-20 bg-white border border-gray-300 rounded-md hover:border-orange-500 peer-focus:border-orange-500">
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
            <em className={`not-italic ${thumbnails.length > 0 ? "text-orange-500" : ""}`}>{thumbnails.length}</em>
            {maxLength ? `/${maxLength}` : ""}
          </span>
        </label>
      </div>
      <div className="pl-20 pt-2 overflow-x-scroll">
        {Boolean(thumbnails.length) ? (
          <div className="flex">
            {thumbnails.map((thumb, index) => (
              <div key={thumb.preview} className="relative ml-3 w-20 shrink-0">
                <div className="relative border border-gray-300 rounded-md overflow-hidden">
                  <span className="block pb-[100%]"></span>
                  <Image src={thumb.preview} alt="" layout="fill" objectFit="cover" className="bg-slate-300 rounded-md" />
                  {index === 0 && <span className="absolute bottom-0 left-0 w-full text-sm text-center text-white bg-black">대표 사진</span>}
                </div>
                <button type="button" className="absolute -top-2 -right-2 w-5 h-5 bg-gray-600 rounded-full outline-none hover:bg-black focus:bg-black" onClick={() => updateFiles("remove", thumb)}>
                  <svg className="m-auto w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-20"></div>
        )}
      </div>
    </div>
  );
};

export default Files;
