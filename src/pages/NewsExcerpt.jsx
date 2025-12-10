import React from 'react';

const NewsExcerpt = ({ text }) => {
  if (!text) return null;
  return (
    <div className="w-full mb-8">
      <p className="news-article-excerpt text-white/90 font-medium border-l-4 border-brand-purple pl-4">
        {text}
      </p>
    </div>
  );
};

export default NewsExcerpt;
