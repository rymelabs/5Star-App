import React from 'react';

const NewsExcerpt = ({ text }) => {
  if (!text) return null;
  return (
    <div className="w-full">
      <p
        className="w-full news-article-excerpt text-white/90 mb-8 font-medium border-l-4 border-brand-purple pl-4"
        style={{ fontSize: 'clamp(1.6rem, 2.8vw, 2rem)', lineHeight: 1.6 }}
      >
        {text}
      </p>
    </div>
  );
};

export default NewsExcerpt;
