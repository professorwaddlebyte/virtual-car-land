# UAE Car Marketplace Frontend

AI-powered car matching platform with cultural preference awareness.

## Features

- **AI Quiz Matching**: 7-question flow for personalized vehicle recommendations
- **Advanced Filters**: Comprehensive filter system with 3 categories
- **Match Dashboard**: 3-column layout showing matches with explanations
- **Cultural Awareness**: Badges for "Popular with X buyers" based on nationality
- **Dubai Theme**: Blue (#0055A4) and Gold (#FFD700) color scheme
- **Mobile Responsive**: Works on all screen sizes

## Components

1. **FilterPanel** (`/src/components/FilterPanel.jsx`) - Advanced filter sidebar
2. **QuizWizard** (`/src/components/QuizWizard.jsx`) - Interactive 7-question quiz
3. **MatchDashboard** (`/src/views/MatchDashboard.jsx`) - 3-column results interface
4. **API Client** (`/src/services/api.js`) - Backend communication service

## Backend Integration

The frontend connects to a backend API with 4 endpoints:

1. `POST /api/v1/match/quiz` - Quiz-based matching
2. `POST /api/v1/match/filters` - Filter-based matching
3. `GET /api/v1/match/cultural/{nationality}` - Cultural preferences
4. `GET /api/v1/match/similar/{vehicleId}` - Similar vehicles

## Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- Backend server running on port 3001 (or update API_BASE_URL in api.js)

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── pages/
│   ├── _app.js          # Next.js app wrapper
│   └── index.js         # Main dashboard page
├── src/
│   ├── components/
│   │   ├── FilterPanel.jsx       # Filter sidebar (822 lines)
│   │   ├── FilterPanelExample.jsx # Demo usage
│   │   └── QuizWizard.jsx        # 7-question quiz (308 lines)
│   ├── views/
│   │   └── MatchDashboard.jsx    # 3-column dashboard (760 lines)
│   └── services/
│       └── api.js                # API client with mock data
├── styles/
│   └── globals.css      # Global styles with Dubai theme
├── public/              # Static assets
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind config with Dubai colors
├── postcss.config.js   # PostCSS config
└── next.config.js      # Next.js config
```

## API Configuration

By default, the frontend expects the backend to be running on `http://localhost:3001`.

Update the API URL by setting environment variable:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Or modify `API_BASE_URL` in `/src/services/api.js`.

## Mock Data Mode

If the backend is not available, the API client automatically provides mock data for:
- Quiz matches (5 vehicles with match scores)
- Filter matches (3 vehicles)
- Fallback UI states

## Development Notes

### Tailwind Configuration
The Dubai theme colors are defined in `tailwind.config.js`:
- `dubai-blue: #0055A4`
- `dubai-gold: #FFD700`
- `dubai-blue-light: #3366CC`
- `dubai-gold-light: #FFED4E`

### Component Integration
The main dashboard (`pages/index.js`) integrates all three components:
- **FilterPanel** for advanced filtering
- **QuizWizard** for AI-powered matching
- **MatchDashboard** for displaying results

### Cultural Preferences
The system includes 5 cultural profiles:
- Emirati (luxury makes, SUVs, white/black/beige)
- South Asian (reliable makes, sedans, silver/white/grey)
- European (performance makes, sport sedans, black/blue/red)
- East Asian (hybrid/electric focus, white/silver/grey)
- African (robust 4x4s, SUVs, white/black/green)

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=production
```

## Testing

Run the development server and test:
1. Open [http://localhost:3000](http://localhost:3000)
2. Try the AI quiz (7 questions)
3. Test advanced filters
4. Verify responsive design on mobile
5. Check cultural badges appear correctly

## License

MIT