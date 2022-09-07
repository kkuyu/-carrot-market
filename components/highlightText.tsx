import type { HTMLAttributes } from "react";

interface HighlightTextProps extends HTMLAttributes<HTMLSpanElement> {
  originalText: string;
  highlightWord: string;
}

const HighlightText = (props: HighlightTextProps) => {
  const { originalText = "", highlightWord = "", className = "", ...restProps } = props;

  // variable: invisible
  const regex = new RegExp(`(${highlightWord.replace(/;/g, "|")})`, "gi");
  const parts = originalText.split(regex).filter((part) => part);

  if (!highlightWord.length) return <span>{originalText}</span>;

  return (
    <>
      {parts.map((part, i) =>
        !part.match(regex) ? (
          <span key={i}>{part}</span>
        ) : (
          <em key={i} className={`not-italic ${className}`}>
            {part}
          </em>
        )
      )}
    </>
  );
};

export default HighlightText;
