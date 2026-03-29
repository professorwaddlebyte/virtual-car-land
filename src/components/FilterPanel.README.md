# FilterPanel Component

A comprehensive, mobile-first filter sidebar component for the UAE Car Marketplace, featuring collapsible sections, dual-range sliders, color swatch pickers, and filter chips with Dubai blue/gold theme.

## Features

✅ **Complete Implementation** - All requirements from AI_MATCHING_SPEC.md Section 3.1
✅ **Mobile-First Responsive Design** - Collapses to drawer on small screens
✅ **Filter Categories** - Basic, Advanced, and Trust filters
✅ **Dual-Range Sliders** - Custom implementation for year, price, and mileage
✅ **Color Swatch Picker** - Visual color selection with 10 common colors
✅ **Filter Chips** - Selected filters appear as removable chips
✅ **Global State Management** - React Context for filter state
✅ **Modern UI** - Glass-morphism, rounded corners, subtle shadows
✅ **Dubai Theme** - Blue/Gold palette with Inter font

## Component Structure

### 1. `FilterPanel.jsx` - Main Component
- **File**: `/home/snaroot/projects/dubai/car-marketplace/frontend/src/components/FilterPanel.jsx`
- **Exports**:
  - `FilterPanel` (default): Main filter sidebar component
  - `useFilter`: Hook for accessing filter context
  - `FilterProvider`: Context provider for global filter state
  - `ExampleUsage`: Demo component showing integration

### 2. `FilterPanel.module.css` - Styling
- Dubai color palette (blue/gold gradients)
- Responsive design breakpoints
- Custom slider styling
- Animation classes

### 3. `FilterPanelExample.jsx` - Usage Example
- Complete example with mock data
- Shows filter integration with results display
- Mobile toggle functionality

## Installation & Setup

### 1. Install Dependencies
```bash
npm install lucide-react
```

If using Tailwind CSS, ensure it's configured with:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'dubai-blue': '#0055A4',
        'dubai-gold': '#FFD700',
        'dubai-blue-light': '#3366CC',
        'dubai-gold-light': '#FFED4E',
      },
      backgroundImage: {
        'gradient-dubai': 'linear-gradient(135deg, #0055A4 0%, #FFD700 100%)',
      }
    }
  }
}
```

### 2. Import Font
Add Inter font to your project:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Or in CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

## Usage

### Basic Implementation
```jsx
import React from 'react';
import FilterPanel, { FilterProvider } from './components/FilterPanel';

function App() {
  const handleFilterChange = (filters) => {
    console.log('Filters changed:', filters);
    // Make API call with filters
  };

  return (
    <FilterProvider onFilterChange={handleFilterChange}>
      <div className="app-container">
        {/* Your header, search bar, etc */}
        <div className="layout">
          <FilterPanel onFilterChange={handleFilterChange} />
          {/* Your results component */}
        </div>
      </div>
    </FilterProvider>
  );
}
```

### Advanced Usage with State
```jsx
import React, { useState, useEffect } from 'react';
import FilterPanel, { FilterProvider, useFilter } from './components/FilterPanel';

function ResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { filters } = useFilter();
  
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      // API call with filters
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const data = await response.json();
      setResults(data);
      setLoading(false);
    };
    
    fetchResults();
  }, [filters]);
  
  return (
    <div>
      <FilterPanel />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <CarResults cars={results} />
      )}
    </div>
  );
}

function App() {
  return (
    <FilterProvider>
      <ResultsPage />
    </FilterProvider>
  );
}
```

## Filter State Structure

```javascript
{
  // Basic Filters
  makes: [],                   // Array of selected makes
  models: [],                 // Array of selected models
  yearRange: [1990, 2026],    // [min, max] years
  priceRange: [10000, 500000], // [min, max] AED
  mileageRange: [0, 200000],  // [min, max] km
  
  // Advanced Filters
  bodyTypes: [],              // Array of selected body types
  fuelTypes: [],              // Array of selected fuel types
  transmission: [],            // Array (single) for transmission type
  colors: [],                 // Array of selected color names
  locations: [],              // Array of selected locations
  
  // Trust Filters
  accidentFreeOnly: false,
  serviceHistoryAvailable: false,
  certifiedPreOwned: false,
  verifiedSeller: false,
}
```

## Props

### FilterPanel Component
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFilterChange` | Function | `undefined` | Callback fired when filters change |
| `className` | String | `''` | Additional CSS classes |

### FilterProvider Component
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | Required | Child components |
| `onFilterChange` | Function | `undefined` | Global filter change callback |

## Available Data

### Default Car Makes & Models
```javascript
{
  'Toyota': ['Camry', 'Corolla', 'Land Cruiser', 'Prado', 'Hilux'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLS'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X5', 'X7'],
  'Audi': ['A4', 'A6', 'Q7', 'Q8'],
  'Range Rover': ['Sport', 'Velar', 'Evoque'],
  'Lexus': ['ES', 'LS', 'RX', 'LX'],
  'Honda': ['Accord', 'Civic', 'CR-V'],
  'Nissan': ['Patrol', 'Altima', 'Sunny'],
  'Hyundai': ['Sonata', 'Elantra', 'Tucson'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
}
```

### Available Colors (with hex values)
```javascript
[
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Gray', value: '#808080' },
  { name: 'Blue', value: '#007AFF' },
  { name: 'Red', value: '#FF3B30' },
  { name: 'Green', value: '#34C759' },
  { name: 'Brown', value: '#A2845E' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Beige', value: '#F5F5DC' },
]
```

### Available Locations
```javascript
[
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah',
  'Fujairah', 'Umm Al Quwain', 'Al Ain'
]
```

## Customization

### 1. Changing Color Palette
Edit `FilterPanel.module.css`:
```css
:root {
  --dubai-blue: #0055A4;
  --dubai-gold: #FFD700;
  /* Add your custom colors */
}
```

### 2. Adding More Car Makes/Models
Update the `makeModels` state in `FilterPanel.jsx`:
```javascript
const [makeModels, setMakeModels] = useState({
  // ... existing makes
  'New Brand': ['Model 1', 'Model 2', 'Model 3'],
});
```

### 3. Custom Filter Ranges
Modify the initial state in `FilterProvider`:
```javascript
yearRange: [2000, 2024], // Custom year range
priceRange: [20000, 300000], // Custom price range
mileageRange: [0, 150000], // Custom mileage range
```

## Responsive Behavior

### Desktop (>1024px)
- Fixed sidebar (1/4 width)
- Always visible
- No overlay

### Tablet (768px - 1024px)
- Fixed sidebar (adjusts width)
- Scrollable if content overflows

### Mobile (<768px)
- Hidden drawer (off-screen)
- Toggle button in top-left
- Full-screen overlay when open
- Swipe or click overlay to close

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 60+

## Performance Notes

- Uses React.memo for optimization
- Debounced filter updates (implement in parent)
- Virtual scrolling for large lists (implement in parent)

## Accessibility

- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ Color contrast compliant
- ✅ Focus states

## Testing

Run the example component to verify:
```bash
# Install dependencies
npm install react react-dom lucide-react

# Run development server
npm start
```

## License

MIT License - Free to use and modify

## Roadmap

1. **Next Version** 
   - Debounced filter updates
   - URL state synchronization
   - Save filters to localStorage
   - Filter presets (e.g., "Family SUV", "Luxury Sedan")

2. **Future Features**
   - Price histogram visualization
   - Saved searches
   - Filter comparison
   - Export filters as URL

---

**Created**: February 18, 2026  
**Last Updated**: February 18, 2026  
**Version**: 1.0.0  
**Compliance**: AI_MATCHING_SPEC.md Section 3.1