export function Header({ title, subtitle, size = "md" }: { title?: string, subtitle?: string, size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  };
  
  return (
    <div className="mb-10 mt-4 flex flex-col gap-1.5">
      <h1 className={`${sizeClasses[size || "md"]} font-bold text-text-primary tracking-tight`}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-lg text-text-muted font-medium max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
