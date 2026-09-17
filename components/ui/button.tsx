import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  size?: ButtonSize;
  square?: boolean;
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-0 bg-[var(--forest)] text-white shadow-none hover:bg-[var(--forest-deep)]",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-error",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

export function Button({
  children,
  className = "",
  disabled,
  loading = false,
  size = "md",
  square = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = [
    "btn focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    variantClasses[variant],
    sizeClasses[size],
    square ? "btn-square" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...props}
      aria-busy={loading || undefined}
      className={classes}
      disabled={disabled || loading}
      type={type}
    >
      {loading && (
        <span aria-hidden="true" className="loading loading-spinner loading-sm" />
      )}
      {children}
    </button>
  );
}
