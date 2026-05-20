import { cn } from "@/lib/utils";

type AdminPageShellProps = {
  children: React.ReactNode;
  className?: string;
  /** Sayfa tam genişlik (varsayılan: max-w-7xl merkez) */
  fullWidth?: boolean;
};

export function AdminPageShell({
  children,
  className,
  fullWidth = false,
}: AdminPageShellProps) {
  return (
    <div
      className={cn(
        "admin-page",
        !fullWidth && "mx-auto w-full max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}

type AdminPageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("admin-page-header", className)}>
      <div className="min-w-0 flex-1">
        <h1>{title}</h1>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </div>
  );
}
