interface DynamicComponentProps {
  text?: string;
}

console.log("Dynamic Component Import");

export default function DynamicComponent({ text }: DynamicComponentProps) {
  return <div>text: {text}</div>;
}
