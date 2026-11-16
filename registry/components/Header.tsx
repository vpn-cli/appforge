export function Header({ title, subtitle, size = "md" }: { title?: string, subtitle?: string, size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "text-base font-semibold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold"
  };
  
  return (
    <div className="mb-6 mt-2 flex flex-col gap-1">
      <h1 className={`${sizeClasses[size || "md"]} text-foreground tracking-tight`}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

