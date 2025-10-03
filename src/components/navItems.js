import { Home, Calendar, Newspaper, TrendingUp } from 'lucide-react';

export const navItems = [
  {
    path: '/',
    label: 'Latest',
    icon: Home,
  },
  {
    path: '/fixtures',
    label: 'Fixtures',
    icon: Calendar,
  },
  {
    path: '/news',
    label: 'News',
    icon: Newspaper,
  },
  {
    path: '/stats',
    label: 'Stats',
    icon: TrendingUp,
  },
];