import { ButtonHTMLAttributes, ReactNode } from "react";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function PixelButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: PixelButtonProps) {
  const baseStyles =
    "font-pixel text-xs px-6 py-3 pixel-border-sm pixel-btn transition-colors";

  const variantStyles = {
    primary: "bg-christmas-red text-white hover:bg-red-700",
    secondary: "bg-grey-light text-foreground hover:bg-grey-medium",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
