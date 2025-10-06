import { Home, Calendar, Users, Newspaper, TrendingUp } from 'lucide-react';

// Translation keys - actual labels will be translated in the component
export const navItems = [
  {
    path: '/',
    labelKey: 'navigation.latest',
    icon: Home,
  },
  {
    path: '/fixtures',
    labelKey: 'navigation.fixtures',
    icon: Calendar,
  },
  {
    path: '/teams',
    labelKey: 'navigation.teams',
    icon: Users,
  },
  {
    path: '/news',
    labelKey: 'navigation.news',
    icon: Newspaper,
  },
  {
    path: '/stats',
    labelKey: 'stats.title',
    icon: TrendingUp,
  },
];