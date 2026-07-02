import type { InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className = "", ...props }: CheckboxProps) {
  return (
    <label className={`flex min-h-11 items-center gap-3 ${className}`}>
      <input type="checkbox" className="size-5 accent-green-600" {...props} />
      <span className="text-base">{label}</span>
    </label>
  );
}
