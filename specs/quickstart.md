# Quickstart: Aceternity UI Integration

## Getting Started

### Prerequisites ✅
- Node.js 18+ installed
- Next.js 15 project setup
- TypeScript configuration
- TailwindCSS configured
- Aceternity UI components installed

### Installation Status ✅
All Aceternity UI components have been successfully installed:
```bash
# Already completed via shadcn MCP
npx shadcn@latest add @aceternity/3d-card
npx shadcn@latest add @aceternity/sparkles  
npx shadcn@latest add @aceternity/background-beams
npx shadcn@latest add @aceternity/floating-navbar
npx shadcn@latest add @aceternity/meteors
npx shadcn@latest add @aceternity/aurora-background
npx shadcn@latest add @aceternity/infinite-moving-cards
```

### Quick Verification
1. **Build Check**: `npm run build` ✅ (completed successfully)
2. **Demo Page**: Available at `/aceternity-demo` ✅
3. **TypeScript**: All components properly typed ✅

## 30-Minute Quick Implementation

### Step 1: Landing Page Enhancement (10 minutes)
```typescript
// Replace your current hero section in pages/index.tsx
import { BackgroundBeams } from "@/components/ui/background-beams";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function Home() {
  return (
    <AuroraBackground className="relative h-screen flex items-center justify-center">
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Educational Quiz Generator
        </h1>
        <p className="text-xl text-gray-300">
          AI-powered quiz generation for enhanced learning
        </p>
      </div>
      <BackgroundBeams />
    </AuroraBackground>
  );
}
```

### Step 2: Quiz Cards Enhancement (10 minutes)
```typescript
// Enhance your QuizDisplay.tsx component
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

export const QuizCard = ({ question, options }: QuizCardProps) => {
  return (
    <CardContainer className="inter-var">
      <CardBody className="bg-gray-50 relative group/card dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-6 border">
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white"
        >
          {question}
        </CardItem>
        <CardItem translateZ="100" className="w-full mt-4">
          <div className="space-y-2">
            {options.map((option, index) => (
              <button 
                key={index}
                className="w-full p-3 text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
};
```

### Step 3: Navigation Enhancement (10 minutes)
```typescript
// Add floating navigation to your app
import { FloatingNav } from "@/components/ui/floating-navbar";
import { IconHome, IconMessage, IconUser } from "@tabler/icons-react";

const navItems = [
  { name: "Home", link: "/", icon: <IconHome className="h-4 w-4" /> },
  { name: "Quiz", link: "/quiz", icon: <IconMessage className="h-4 w-4" /> },
  { name: "History", link: "/history", icon: <IconUser className="h-4 w-4" /> },
];

// Add to your _app.tsx or layout
<FloatingNav navItems={navItems} />
```

## Component Import Patterns

### Centralized Imports
```typescript
// Use the aceternity index for clean imports
import {
  CardContainer,
  CardBody, 
  CardItem,
  BackgroundBeams,
  AuroraBackground,
  SparklesCore,
  FloatingNav,
  InfiniteMovingCards,
  Meteors
} from "@/components/aceternity";
```

### Individual Imports
```typescript
// Direct component imports for specific use cases
import { CardContainer } from "@/components/ui/3d-card";
import { BackgroundBeams } from "@/components/ui/background-beams";
```

## Common Usage Patterns

### 1. Page Backgrounds
```typescript
// Aurora background for hero sections
<AuroraBackground className="min-h-screen">
  {/* Your content */}
</AuroraBackground>

// Background beams for accent sections
<div className="relative">
  <BackgroundBeams />
  <div className="relative z-10">
    {/* Your content */}
  </div>
</div>
```

### 2. Interactive Cards
```typescript
// 3D card wrapper pattern
<CardContainer>
  <CardBody>
    <CardItem translateZ="50">{title}</CardItem>
    <CardItem translateZ="100">{content}</CardItem>
  </CardBody>
</CardContainer>
```

### 3. Particle Effects
```typescript
// Sparkles overlay
<div className="relative">
  <SparklesCore
    id="particles"
    background="transparent"
    minSize={0.6}
    maxSize={1.4}
    particleDensity={100}
    className="absolute inset-0"
    particleColor="#FFFFFF"
  />
  <div className="relative z-10">
    {/* Content */}
  </div>
</div>
```

## Performance Best Practices

### 1. Lazy Loading
```typescript
// Dynamic imports for heavy components
const AuroraBackground = dynamic(
  () => import("@/components/ui/aurora-background").then(mod => ({ default: mod.AuroraBackground })),
  { ssr: false }
);
```

### 2. Intersection Observer
```typescript
// Trigger animations only when visible
import { useInView } from "framer-motion";

const ref = useRef(null);
const isInView = useInView(ref, { once: true });

return (
  <div ref={ref}>
    {isInView && <AnimatedComponent />}
  </div>
);
```

### 3. Reduced Motion
```typescript
// Respect user preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const animationProps = prefersReducedMotion.matches 
  ? { animate: false }
  : { animate: true, duration: 0.5 };
```

## Debugging and Development

### 1. Animation Performance
```typescript
// Monitor frame rate
const fps = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log('Frame time:', entry.duration);
  });
});
fps.observe({ entryTypes: ['measure'] });
```

### 2. Bundle Size Analysis
```bash
# Analyze bundle impact
npm run build
npm run analyze  # if analyzer is configured
```

### 3. Common Issues
```typescript
// Fix: Component not animating
// Ensure proper z-index and transform-style
.animated-container {
  transform-style: preserve-3d;
  perspective: 1000px;
}

// Fix: Performance issues
// Use transform instead of changing layout properties
.animation {
  transform: translateX(100px);  /* Good */
  left: 100px;                   /* Avoid */
}
```

## Testing Quick Checks

### 1. Visual Verification
- [ ] Animations run smoothly at 60fps
- [ ] Components are responsive on mobile
- [ ] Dark/light mode compatibility
- [ ] Hover states work on desktop
- [ ] Touch interactions work on mobile

### 2. Accessibility Check
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Reduced motion preference respected
- [ ] Proper ARIA labels
- [ ] Color contrast meets standards

### 3. Performance Check
- [ ] Build completes without errors
- [ ] Bundle size increase < 500KB
- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] Memory usage remains stable

## Next Steps

1. **Complete Quick Implementation** (30 minutes)
2. **Review Demo Page** at `/aceternity-demo`
3. **Begin Phase A Tasks** from the implementation plan
4. **Monitor Performance** throughout development
5. **Test Accessibility** at each milestone

## Support and Resources

### Documentation
- [Aceternity UI Docs](https://ui.aceternity.com)
- [Implementation Plan](/specs/implementation-plan.md)
- [Task Breakdown](/specs/tasks.md)

### Common Commands
```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run lint           # Check code quality

# Testing
npm test               # Run unit tests
npm run test:e2e      # Run end-to-end tests
```

### File Structure
```
frontend/src/
├── components/
│   ├── ui/                     # Aceternity components
│   ├── aceternity/            # Component exports
│   └── [feature]/            # Enhanced components
├── pages/                     # Next.js pages
├── lib/                      # Utilities
└── styles/                   # Global styles
```

**Ready to begin!** Start with the 30-minute quick implementation, then proceed with the full 8-day enhancement plan.