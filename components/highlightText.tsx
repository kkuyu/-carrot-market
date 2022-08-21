import type { HTMLAttributes } from "react";

interface HighlightTextProps extends HTMLAttributes<HTMLSpanElement> {
  originalText: string;
  highlightWord: string;
}

const HighlightText = (props: HighlightTextProps) => {
  const { originalText = "", highlightWord = "", className = "", ...restProps } = props;

  const regex = new RegExp(`(${highlightWord.replace(/;/g, "|")})`, "gi");
  const parts = originalText.split(regex).filter((part) => part);

  if (!highlightWord.length) return <span>{originalText}</span>;

  return (
    <span className={`${className}`} {...restProps}>
      {parts.map((part, i) => {
        if (part.match(regex)) return <strong key={i}>{part}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export default HighlightText;
