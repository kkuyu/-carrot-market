import type { HTMLAttributes } from "react";

interface HighlightsProps extends HTMLAttributes<HTMLSpanElement> {
  text: string;
  highlight: string[];
}

const Highlights = (props: HighlightsProps) => {
  const { text = "", highlight = [], className = "", ...restProps } = props;

  const regex = new RegExp(`(${highlight.join("|")})`, "gi");
  const parts = text.split(regex).filter((part) => part);

  if (!highlight.length) return <span>{text}</span>;

  return (
    <span className={`${className}`} {...restProps}>
      {parts.map((part, i) => {
        if (part.match(regex)) return <strong key={i}>{part}</strong>;
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export default Highlights;
