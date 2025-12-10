// Date formatting utilities
export const formatDate = (dateString, options = {}) => {
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatDateTime = (dateString) => {
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

export const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return formatDate(dateString);
};

export const isFestiveSeason = () => {
  const now = new Date();
  const endDate = new Date('2026-01-25T23:59:59');
  return now <= endDate;
};

export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isTomorrow = (dateString) => {
  const date = new Date(dateString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
};

export const isYesterday = (dateString) => {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};

export const getMatchDayLabel = (dateString) => {
  if (isToday(dateString)) return 'Today';
  if (isTomorrow(dateString)) return 'Tomorrow';
  if (isYesterday(dateString)) return 'Yesterday';
  return formatDate(dateString, { weekday: 'long', month: 'short', day: 'numeric' });
};
