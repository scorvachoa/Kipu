import {
  Utensils,
  ShoppingCart,
  Clapperboard,
  Receipt,
  HeartPulse,
  GraduationCap,
  Plane,
  Repeat,
  Home,
  Landmark,
  MoreHorizontal,
  Car,
  Zap,
  Droplets,
  Wifi,
  Smartphone,
  Laptop,
  Shirt,
  Baby,
  Dog,
  Coffee,
  Pizza,
  Gift,
  PiggyBank,
  Wallet,
  Music,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Briefcase,
  Scissors,
  Sparkles,
  TreePine,
  Package,
  Store,
  UtensilsCrossed,
  Ticket,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: "Utensils", icon: Utensils },
  { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Store", icon: Store },
  { name: "Coffee", icon: Coffee },
  { name: "Pizza", icon: Pizza },
  { name: "Clapperboard", icon: Clapperboard },
  { name: "Music", icon: Music },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Receipt", icon: Receipt },
  { name: "Zap", icon: Zap },
  { name: "Droplets", icon: Droplets },
  { name: "Wifi", icon: Wifi },
  { name: "Smartphone", icon: Smartphone },
  { name: "Laptop", icon: Laptop },
  { name: "Car", icon: Car },
  { name: "Plane", icon: Plane },
  { name: "Home", icon: Home },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "BookOpen", icon: BookOpen },
  { name: "Shirt", icon: Shirt },
  { name: "Baby", icon: Baby },
  { name: "Dog", icon: Dog },
  { name: "Gift", icon: Gift },
  { name: "PiggyBank", icon: PiggyBank },
  { name: "Landmark", icon: Landmark },
  { name: "Wallet", icon: Wallet },
  { name: "Repeat", icon: Repeat },
  { name: "Briefcase", icon: Briefcase },
  { name: "Dumbbell", icon: Dumbbell },
  { name: "Scissors", icon: Scissors },
  { name: "Sparkles", icon: Sparkles },
  { name: "TreePine", icon: TreePine },
  { name: "Package", icon: Package },
  { name: "Ticket", icon: Ticket },
  { name: "UtensilsCrossed", icon: UtensilsCrossed },
  { name: "MoreHorizontal", icon: MoreHorizontal },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  CATEGORY_ICON_OPTIONS.map(({ name, icon }) => [name, icon]),
);

const EMOJI_FALLBACK = /^[\p{Emoji_Presentation}\p{Emoji}\u200d]+$/u;

export function isEmojiIcon(value: string | null | undefined): boolean {
  if (!value) return false;
  return EMOJI_FALLBACK.test(value);
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  if (!name) {
    return <MoreHorizontal className={className} />;
  }
  const Icon = ICON_MAP[name];
  if (Icon) {
    return <Icon className={className} aria-hidden />;
  }
  if (isEmojiIcon(name)) {
    return <span className={className} aria-hidden>{name}</span>;
  }
  return <MoreHorizontal className={className} aria-hidden />;
}
