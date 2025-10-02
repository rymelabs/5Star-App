import React, { useState, useEffect } from 'react';

const AuthBackground = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Media files from public/LandingPageBG folder (optimized)
  const mediaFiles = [
    { type: 'image', src: '/LandingPageBG/bg1.jpg' },
    { type: 'image', src: '/LandingPageBG/bg2.jpg' },
    { type: 'image', src: '/LandingPageBG/bg3.jpg' },
  ];

  useEffect(() => {
    // Change slide every 5 seconds
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaFiles.length);
        setIsTransitioning(false);
      }, 500); // Half of transition time for smooth effect
    }, 5000);

    return () => clearInterval(interval);
  }, [mediaFiles.length]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      {/* Render all media items */}
      {mediaFiles.map((media, index) => {
        const isActive = index === currentIndex;
        const isPrevious = index === (currentIndex - 1 + mediaFiles.length) % mediaFiles.length;

        return (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
              isActive
                ? 'opacity-100 translate-x-0 z-[1]'
                : isPrevious
                ? 'opacity-0 -translate-x-full z-0'
                : 'opacity-0 translate-x-full z-0'
            }`}
          >
            {media.type === 'video' ? (
              <video
                src={media.src}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={media.src}
                alt="Background"
                className="w-full h-full object-cover"
                loading="eager"
              />
            )}
          </div>
        );
      })}

      {/* Red to black gradient overlay with 90% transparency */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 via-red-950/90 to-black/90 z-[2]" />

      {/* Slideshow indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-[4]">
        {mediaFiles.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setIsTransitioning(true);
              setTimeout(() => {
                setCurrentIndex(index);
                setIsTransitioning(false);
              }, 500);
            }}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default AuthBackground;
