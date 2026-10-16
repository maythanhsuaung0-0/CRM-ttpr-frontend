import { cn } from "@/lib/utils";

export function BrandLogo({ className }) {
  return (
    <span className={cn("whitespace-nowrap font-sans text-[15px] font-normal not-italic leading-6 tracking-tight text-logo", className)}>
      Citytech<span className="text-logo-accent">CRM</span>
    </span>
  );
}
