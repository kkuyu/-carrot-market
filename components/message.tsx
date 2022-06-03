import { cls } from "@libs/utils";

interface MessageProps {
  message: string;
  reversed?: boolean;
  avatarUrl?: string;
}

export default function Message({ message, avatarUrl, reversed }: MessageProps) {
  return (
    <div className={cls("flex items-start space-x-2", reversed ? "flex-row-reverse space-x-reverse" : "")}>
      <div className="flex-none w-8 h-8 rounded-full bg-slate-400" />
      <div className="max-w-[65%] p-2 border rounded-md">
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
}
