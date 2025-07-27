# MealPlanner Style Guide

## Design Philosophy
Our design system emphasizes modern, clean aesthetics with a focus on usability, readability, and visual hierarchy. We prioritize user experience through consistent spacing, clear typography, and intuitive interactions.

## Color Palette

### Primary Colors
- **Primary Green**: `green-600` (#059669) - Main CTAs, primary actions
- **Primary Green Hover**: `green-700` (#047857) - Hover states
- **Accent Green**: `green-400` (#34d399) - Highlights, accents
- **Light Green**: `green-100` (#d1fae5) - Backgrounds, subtle accents
- **Green Text on Dark**: `green-500` (#10b981) - For visibility on dark backgrounds

### Neutral Colors
- **Text Primary**: `gray-900` (#111827) - Main text
- **Text Secondary**: `gray-600` (#4b5563) - Secondary text
- **Text Tertiary**: `gray-400` (#9ca3af) - Muted text
- **Background**: `white` - Primary background
- **Background Alt**: `gray-50` (#f9fafb) - Alternating sections
- **Dark Background**: `gray-900` (#111827) - Footer, dark sections

### Semantic Colors
- **Error**: `red-500` (#ef4444)
- **Warning**: `yellow-500` (#eab308)
- **Success**: `green-500` (#10b981)
- **Info**: `blue-500` (#3b82f6)

## Typography

### Font Family
- Primary: System font stack (san-serif)

### Font Sizes & Weights
- **Hero Headings**: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold`
- **Section Headings**: `text-3xl md:text-4xl lg:text-5xl font-bold`
- **Subsection Headings**: `text-xl md:text-2xl font-semibold`
- **Body Large**: `text-lg md:text-xl`
- **Body**: `text-base`
- **Body Small**: `text-sm`
- **Caption**: `text-xs`

### Line Heights
- Headings: `leading-tight`
- Body text: `leading-relaxed`

## Spacing

### Section Padding
- Mobile: `py-16`
- Desktop: `md:py-24`
- Container: `px-4 sm:px-6 lg:px-8`
- Max width: `max-w-7xl mx-auto`

### Component Spacing
- Card padding: `p-6` to `p-8`
- Button padding: `px-6 sm:px-8 py-4`
- Input padding: `px-4 py-3`
- Grid gaps: `gap-6 lg:gap-8`

## Layout Patterns

### Grid Systems
```
// Mobile-first responsive grids
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
grid md:grid-cols-3
```

### Container Widths
- Full: `max-w-7xl`
- Content: `max-w-4xl`
- Narrow: `max-w-2xl`
- Form: `max-w-md`

## Component Styles

### Buttons

#### Primary Button
```
bg-green-600 text-white px-6 sm:px-8 py-4 rounded-xl text-base sm:text-lg font-semibold 
hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg
```

#### Secondary Button
```
bg-white/10 backdrop-blur-sm text-white px-6 sm:px-8 py-4 rounded-xl text-base sm:text-lg 
font-semibold border-2 border-white/50 hover:bg-white/20 hover:border-white transition-all duration-200
```

#### Ghost Button
```
text-gray-700 hover:text-gray-900 px-3 md:px-4 py-2 text-sm md:text-base font-medium transition-colors
```

### Cards

#### Standard Card
```
bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200
```

#### Interactive Card
```
bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 group
```

#### Glass Card
```
bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all
```

### Form Elements

#### Input Fields
```
w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 
focus:border-transparent transition-all duration-200
```

#### Labels
```
block text-sm font-medium text-gray-700 mb-2
```

### Navigation

#### Fixed Navigation Bar
```
fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-sm z-50 border-b border-gray-100
```

## Effects & Animations

### Hover Effects
- Buttons: `hover:scale-105`
- Cards: `hover:shadow-xl`
- Icons: `group-hover:scale-110`
- Links: Color transitions

### Transitions
- Default: `transition-all duration-200`
- Fast: `transition-all duration-150`
- Slow: `transition-all duration-300`

### Shadows
- Small: `shadow-md`
- Medium: `shadow-lg`
- Large: `shadow-xl`
- Subtle: `shadow-sm`

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens:
```
text-base md:text-lg
px-4 md:px-6
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
```

## Icons
- Size small: `h-5 w-5`
- Size medium: `h-6 w-6`
- Size large: `h-8 w-8`
- Size xlarge: `h-10 w-10` to `h-14 w-14`

## Best Practices

1. **Consistency**: Use the same patterns across all pages
2. **Accessibility**: Ensure sufficient color contrast and focus states
3. **Performance**: Use Tailwind's purge to minimize CSS bundle
4. **Responsive**: Test on all screen sizes
5. **Interactive Feedback**: Always provide hover/active states
6. **Loading States**: Use skeleton screens or spinners
7. **Error Handling**: Clear error messages with semantic colors

## Implementation Examples

### Hero Section
```jsx
<section className="relative min-h-screen flex items-center justify-center">
  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/70 to-black/60" />
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
    <!-- Content -->
  </div>
</section>
```

### Content Section
```jsx
<section className="py-16 md:py-24 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12 md:mb-16">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
        Section Title
      </h2>
      <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
        Section description
      </p>
    </div>
    <!-- Content -->
  </div>
</section>
``` 