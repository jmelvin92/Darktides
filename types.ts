
import { LucideIcon } from 'lucide-react';

export interface SectionProps {
  id?: string;
  className?: string;
}

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface NavProps {
  currentView: 'home' | 'store';
  onNavigate: (view: 'home' | 'store', sectionId?: string) => void;
}

export interface HeroProps {
  onEnterLab: () => void;
}
