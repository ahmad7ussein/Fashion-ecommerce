import { cn } from "@/lib/utils";

const SIZE_STYLES = {
  sm: "h-6 w-6 border-2",
  md: "h-10 w-10 border-4",
  lg: "h-14 w-14 border-4",
};

function AppLoader({ label = "Loading...", size = "md", className }) {
  const sizeClass = SIZE_STYLES[size] || SIZE_STYLES.md;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        className
      )}
    >
      <div
        className={cn(
          "rounded-full border-rose-200 border-t-rose-500 animate-spin",
          sizeClass
        )}
      />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export { AppLoader };
