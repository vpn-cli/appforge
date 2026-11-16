export function Header({
  title,
  subtitle,
  size = "md",
}: {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "text-base font-semibold",
    md: "text-xl font-bold",
    lg: "text-2xl font-bold",
  };

  return (
    <div className="mb-2 mt-0 flex flex-col gap-1 min-w-0">
      {title && (
        <h1
          className={`${
            sizeClasses[size || "md"]
          } text-foreground tracking-tight break-words [overflow-wrap:anywhere] min-w-0`}
        >
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed break-words [overflow-wrap:anywhere] min-w-0">
          {subtitle}
        </p>
      )}
    </div>
  );
}
