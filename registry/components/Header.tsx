export function Header({ title, subtitle, size = "md" }: { title?: string, subtitle?: string, size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  };
  
  return (
    <div className="flex flex-col gap-1.5 mb-2">
      <h1 className={`${sizeClasses[size] || sizeClasses.md} font-bold tracking-tight text-text-primary`}>
        {title || "Untitled Header"}
      </h1>
      {subtitle && (
        <p className="text-text-secondary text-sm max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}
