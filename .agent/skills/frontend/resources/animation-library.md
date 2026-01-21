# Micro-Interactions & Animation Library

Motion is what separates "Websites" from "Cyber-Experiences". Use **Framer Motion** for React.

## 1. Philosophy: "Physics-Based"
Things shouldn't just linear-ease. They should have **mass** and **spring**.
- **Heavy**: `type: "spring", stiffness: 100, damping: 20` (Modals, Panels)
- **Snappy**: `type: "spring", stiffness: 400, damping: 25` (Buttons, checks)

## 2. Essential Animations

### Hover: "The Magnetic Lift"
Buttons shouldn't just change color; they should lift up toward the user.
```jsx
<motion.button
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95, y: 1 }}
/>
```

### Staggered Reveal
Don't show a list all at once. Cascade it.
```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}
const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}
```

### Scroll-Triggered Parallax
Images should move slower than text.
`useScroll` + `useTransform(scrollYProgress, [0, 1], [0, -50])`

### "The Spotlight" (Mouse Tracking)
Cards that reveal a gradient following your cursor.
*(Requires tracking mouse x/y in React state and updating background gradient coordinates)*.

## 3. Recommended Libraries
1.  **Framer Motion**: The gold standard for React.
2.  **Leva**: For tweaking physics parameters in real-time.
3.  **Rive**: For complex vector animations (replacing Lottie).
