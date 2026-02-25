import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export const Input = ({ id, label, error, className, ...props }: InputProps) => {
  return (
    <label className="field" htmlFor={id}>
      {label ? <span className="field-label">{label}</span> : null}
      <input id={id} className={["input", className].filter(Boolean).join(" ")} {...props} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
};
