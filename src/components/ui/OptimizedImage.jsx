import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * OptimizedImage - A performant image component with:
 * - Native lazy loading
 * - Error fallback
 * - Placeholder while loading
 * - Fade-in animation
 * - Intersection Observer for true lazy loading
 * 
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text for accessibility
 * @param {string} className - CSS classes
 * @param {string} fallback - Fallback content (letter or emoji) if image fails
 * @param {string} fallbackBg - Background color for fallback
 * @param {boolean} eager - If true, loads immediately (for above-the-fold images)
 */
const OptimizedImage = memo(({ 
  src, 
  alt = '', 
  className = '', 
  fallback = '?',
  fallbackBg = 'bg-gray-800',
  eager = false,
  onLoad,
  onError,
  ...props 
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isInView, setIsInView] = useState(eager);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (eager || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [eager]);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setError(true);
    onError?.(e);
  };

  // No src provided or error occurred - show fallback
  if (!src || error) {
    return (
      <div 
        ref={containerRef}
        className={`${fallbackBg} flex items-center justify-center text-white font-bold ${className}`}
        {...props}
      >
        {typeof fallback === 'string' && fallback.length === 1 ? (
          <span className="text-xs">{fallback}</span>
        ) : (
          fallback
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} {...props}>
      {/* Placeholder skeleton */}
      {!loaded && (
        <div className={`absolute inset-0 ${fallbackBg} animate-pulse`} />
      )}
      
      {/* Only render image when in view */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`
            w-full h-full object-cover
            transition-opacity duration-300
            ${loaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
