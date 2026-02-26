# Bottom Nav Festive Shimmy Implementation Plan

## Objective
Add a periodic "red shimmy" animation to the Bottom Navigation bar's border during the festive season. This animation should trigger once every 20 minutes to draw attention without being intrusive.

## Technical Approach

### 1. Component Modification
We will modify `src/components/ui/BottomNav.jsx`.

### 2. Dependencies
- **Framer Motion**: We will use `motion` from `framer-motion` to handle the animation.
- **Date Utility**: We will use `isFestiveSeason` from `../../utils/dateUtils` to ensure this only runs during the holiday period.

### 3. State & Logic
- **State**: We don't necessarily need complex state if we use Framer Motion's `animate` prop with a control, but a simple `useEffect` with `setInterval` is robust.
- **Timing**: 
  - Interval: 20 minutes (`20 * 60 * 1000` ms).
  - Duration: ~2-3 seconds for the animation itself.
- **Trigger**:
  - On mount, check `isFestiveSeason()`.
  - If true, set up the interval.

### 4. Animation Design ("The Shimmy")
The "shimmy" will be interpreted as a festive red pulse on the border and a subtle glow.

**Animation Sequence:**
1.  **Start**: Default state (`border-white/10`).
2.  **Active**: 
    - Border Color: Transitions to a festive red (e.g., `#FF0000` or Tailwind `red-500`).
    - Box Shadow: Adds a subtle red glow.
    - Movement (Optional): A very subtle shake (x-axis) to catch the eye, or just the color pulse. *We will focus on the color pulse as requested.*
3.  **End**: Returns to default.

### 5. Implementation Steps

1.  **Imports**:
    ```javascript
    import { motion, useAnimation } from 'framer-motion';
    import { isFestiveSeason } from '../../utils/dateUtils';
    ```

2.  **Convert Element**:
    Change the `<nav>` element to `<motion.nav>`.

3.  **Animation Logic**:
    ```javascript
    const controls = useAnimation();

    useEffect(() => {
      if (!isFestiveSeason()) return;

      const triggerShimmy = async () => {
        await controls.start({
          borderColor: ["rgba(255, 255, 255, 0.1)", "#ef4444", "#ef4444", "rgba(255, 255, 255, 0.1)"],
          boxShadow: [
            "0 25px 50px -12px rgba(0, 0, 0, 0.5)", // Default shadow
            "0 0 15px rgba(239, 68, 68, 0.5)",      // Red glow
            "0 0 15px rgba(239, 68, 68, 0.5)", 
            "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          ],
          transition: { duration: 2.5, times: [0, 0.2, 0.8, 1] }
        });
      };

      // Initial trigger (optional, maybe wait 20 mins or trigger once on load?)
      // Let's trigger it once shortly after load so the user sees it, then every 20 mins.
      const initialTimeout = setTimeout(triggerShimmy, 2000); 

      const interval = setInterval(triggerShimmy, 20 * 60 * 1000);

      return () => {
        clearTimeout(initialTimeout);
        clearInterval(interval);
      };
    }, [controls]);
    ```

4.  **Apply to Component**:
    ```jsx
    <motion.nav
      animate={controls}
      className="..." // Existing classes
      // ... existing props
    >
    ```

## Verification
- We will temporarily set the interval to 5 seconds during development to verify the animation works.
- We will ensure it does not break the existing swipe functionality.
