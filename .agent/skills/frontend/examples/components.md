# Original Component Designs (React + Tailwind)

## 1. The "Neo-Brutalist" Button
High contrast, hard shadows, moves on click.

```jsx
const BrutalistButton = ({ children }) => (
  <button className="
    relative px-8 py-4 bg-[#ccff00] text-black font-black uppercase tracking-widest
    border-2 border-black
    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
    hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]
    active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
    transition-all duration-100 ease-in-out
  ">
    {children}
  </button>
);
```

## 2. The "Glassmorphic" Card
Frosted glass with a subtle noise texture and glowing border.

```jsx
const GlassCard = ({ title, desc }) => (
  <div className="
    relative overflow-hidden
    p-8 rounded-3xl
    bg-white/5 backdrop-blur-2xl
    border border-white/10
    shadow-xl
    group
  ">
    <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>
    <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
    
    <h3 className="relative z-10 text-2xl font-bold text-white mb-2">{title}</h3>
    <p className="relative z-10 text-white/60">{desc}</p>
  </div>
);
```

## 3. The "Magnetic" Input
An input field with a bottom border that expands from the center when focused.

```jsx
const MagneticInput = ({ placeholder }) => (
  <div className="relative group">
    <input 
      type="text" 
      placeholder={placeholder}
      className="w-full bg-transparent border-b border-white/20 py-4 text-xl text-white outline-none placeholder:text-white/20 transition-colors focus:border-white/0"
    />
    <span className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-[#ccff00] transition-all duration-500 group-focus-within:w-full group-focus-within:left-0"></span>
  </div>
);
```

## 4. The "Cyber-Tag"
A tech-inspired tag with angle brackets.

```jsx
const CyberTag = ({ label }) => (
  <span className="
    inline-flex items-center px-3 py-1 
    font-mono text-xs text-[#ccff00] 
    border border-[#ccff00]/30 bg-[#ccff00]/5
    before:content-['<'] before:mr-1 before:text-[#ccff00]/50
    after:content-['/>'] after:ml-1 after:text-[#ccff00]/50
  ">
    {label}
  </span>
);
```

## 5. The "Fluid" Gradient Text
Text that looks like flowing liquid metal.

```jsx
const FluidText = ({ text }) => (
  <h1 className="
    text-6xl font-black text-transparent bg-clip-text 
    bg-gradient-to-r from-purple-400 via-pink-500 to-red-500
    animate-gradient-x
  ">
    {text}
  </h1>
);
// Requires 'animate-gradient-x' in tailwind config (background-position animation)
```
