import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "primary" | "secondary" | "accent";
  onClick?: () => void;
}

const colorMap = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
    hover: "hover:bg-primary/15",
  },
  secondary: {
    bg: "bg-secondary/30",
    icon: "text-secondary-foreground",
    hover: "hover:bg-secondary/50",
  },
  accent: {
    bg: "bg-accent/10",
    icon: "text-accent",
    hover: "hover:bg-accent/15",
  },
};

export function QuickActionCard({ icon: Icon, title, description, color, onClick }: QuickActionCardProps) {
  const colors = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-6 rounded-2xl border border-border bg-card transition-all duration-200 ${colors.hover} hover:shadow-md hover:-translate-y-0.5 text-left w-full`}
    >
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>
      <h3 className="font-display font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
