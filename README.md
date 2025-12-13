# Where The Ball Moves

A web application that visualizes WindBorne Systems' global constellation of weather balloons by combining their live balloon position data with Open-Meteo wind data. The app reconstructs balloon flight paths from 24 hours of historical data, explains balloon motion through wind layer analysis, and provides a 1-hour nowcast prediction based on current wind conditions.

## Features

- **Balloon Track Reconstruction**: Robustly reconstructs individual balloon flight paths using proximity-based matching algorithms
- **Interactive World Map**: Visualize balloon positions and tracks on an interactive map with altitude-based color encoding
- **Wind Data Integration**: Correlates balloon movement with Open-Meteo wind data to explain motion patterns
- **1-Hour Nowcast**: Predicts balloon positions one hour into the future based on current wind conditions
- **Auto-Refresh**: Automatically updates with the latest 24 hours of data every 5-10 minutes
- **Error Handling**: Gracefully handles corrupted or missing data with clear user feedback

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Mapping**: Leaflet with React-Leaflet
- **HTTP Client**: Axios
- **Date Utilities**: date-fns
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js (v20.14.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd whereTheBallMoves
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Project Structure

```
src/
├── components/        # React components
│   ├── Map/          # Map-related components
│   ├── Controls/     # UI controls (selectors, buttons)
│   ├── DetailsPanel/ # Balloon details display
│   ├── ErrorReport/  # Error reporting UI
│   └── Loading/      # Loading indicators
├── services/         # API services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── hooks/            # Custom React hooks
└── context/          # React context providers
```

## Data Sources

- **WindBorne API**: `https://a.windbornesystems.com/treasure/` (00.json through 23.json)
- **Open-Meteo API**: `https://api.open-meteo.com/v1/forecast`

## Deployment

This application is configured for deployment on **Vercel**. The build output is in the `dist` directory.

### Deploying to Vercel

#### Option 1: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI globally:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the project root:
```bash
vercel
```

4. Follow the prompts to link your project and deploy.

#### Option 2: Deploy via GitHub Integration

1. Push your code to GitHub (if not already done):
```bash
git push origin deployment-and-finalization
```

2. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account.

3. Click "Add New Project" and import your repository.

4. Vercel will automatically detect the Vite configuration:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Click "Deploy" and wait for the deployment to complete.

6. Your application will be available at a URL like: `https://where-the-ball-moves.vercel.app`

### Configuration

The `vercel.json` file is already configured with:
- API rewrites to proxy WindBorne API requests (handles CORS)
- Proper build and output settings
- CORS headers for API endpoints

### Post-Deployment

After deployment, update the task list and README with your deployment URL.

**Note**: The application uses Vercel's rewrites feature to proxy API calls to the WindBorne API, which handles CORS issues in production.

## License

This project is part of a coding challenge application.
