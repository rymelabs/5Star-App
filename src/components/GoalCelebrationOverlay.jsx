import React, { useEffect, useMemo, useState } from 'react';

const confettiPalette = ['#22c55e', '#f97316', '#eab308', '#3b82f6', '#ef4444', '#14b8a6'];

const GoalCelebrationOverlay = ({ trigger }) => {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!trigger) return undefined;
    setVisible(true);
    const timeout = setTimeout(() => setVisible(false), reducedMotion ? 900 : 2200);
    return () => clearTimeout(timeout);
  }, [trigger, reducedMotion]);

  const confetti = useMemo(() => (
    Array.from({ length: reducedMotion ? 10 : 32 }, (_, index) => ({
      id: index,
      left: `${Math.floor((index / (reducedMotion ? 10 : 32)) * 100)}%`,
      delay: `${(index % 8) * 40}ms`,
      color: confettiPalette[index % confettiPalette.length],
      duration: `${reducedMotion ? 600 : 1200 + (index % 5) * 140}ms`
    }))
  ), [reducedMotion]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden">
      <div
        className={`absolute top-[30%] left-[-10%] h-10 w-10 rounded-full border-4 border-white bg-black ${reducedMotion ? '' : 'animate-[goal-roll_1.4s_ease-out_forwards]'}`}
        style={reducedMotion ? { left: '45%', top: '38%' } : undefined}
      />

      {confetti.map(piece => (
        <span
          key={piece.id}
          className={`absolute top-[-10px] h-2.5 w-1.5 rounded-sm ${reducedMotion ? 'opacity-70' : ''}`}
          style={{
            left: piece.left,
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration} linear ${piece.delay} forwards`
          }}
        />
      ))}

      <style>{`
        @keyframes goal-roll {
          0% { transform: translateX(0) rotate(0deg) scale(0.7); opacity: 0; }
          12% { opacity: 1; }
          100% { transform: translateX(118vw) rotate(920deg) scale(1); opacity: 1; }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(520deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default GoalCelebrationOverlay;
