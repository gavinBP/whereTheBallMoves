# Task List: WindBorne Balloon Constellation Visualization

## Relevant Files

- `package.json` - Project dependencies and scripts configuration
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` or `craco.config.js` - Build tool configuration
- `src/main.tsx` or `src/index.tsx` - Application entry point
- `src/App.tsx` - Main application component
- `src/App.test.tsx` - Unit tests for App component
- `src/types/balloon.ts` - TypeScript types for balloon data structures
- `src/types/wind.ts` - TypeScript types for wind data structures
- `src/types/track.ts` - TypeScript types for track reconstruction
- `src/services/windborneApi.ts` - Service for fetching WindBorne balloon data
- `src/services/windborneApi.test.ts` - Unit tests for WindBorne API service
- `src/services/openMeteoApi.ts` - Service for fetching Open-Meteo wind data
- `src/services/openMeteoApi.test.ts` - Unit tests for Open-Meteo API service
- `src/utils/trackReconstruction.ts` - Proximity matching algorithm for track reconstruction
- `src/utils/trackReconstruction.test.ts` - Unit tests for track reconstruction
- `src/utils/altitudeMapping.ts` - Utility to map altitude (km) to pressure levels
- `src/utils/altitudeMapping.test.ts` - Unit tests for altitude mapping
- `src/utils/nowcast.ts` - 1-hour prediction logic using wind data
- `src/utils/nowcast.test.ts` - Unit tests for nowcast prediction
- `src/utils/distance.ts` - Geographic distance calculation utilities
- `src/utils/distance.test.ts` - Unit tests for distance calculations
- `src/components/Map/MapView.tsx` - Main map component using Leaflet/Mapbox
- `src/components/Map/MapView.test.tsx` - Unit tests for MapView component
- `src/components/Map/TrackLayer.tsx` - Component for rendering balloon tracks on map
- `src/components/Map/MarkerLayer.tsx` - Component for rendering balloon markers
- `src/components/Map/WindLayer.tsx` - Component for rendering wind vectors
- `src/components/Controls/BalloonSelector.tsx` - Dropdown for selecting balloons
- `src/components/Controls/BalloonSelector.test.tsx` - Unit tests for BalloonSelector
- `src/components/Controls/TimeSelector.tsx` - Dropdown/slider for selecting time
- `src/components/Controls/TimeSelector.test.tsx` - Unit tests for TimeSelector
- `src/components/Controls/RefreshButton.tsx` - Manual refresh button with throttling
- `src/components/Controls/RefreshButton.test.tsx` - Unit tests for RefreshButton
- `src/components/DetailsPanel/DetailsPanel.tsx` - Panel showing balloon details and statistics
- `src/components/DetailsPanel/DetailsPanel.test.tsx` - Unit tests for DetailsPanel
- `src/components/ErrorReport/ErrorReport.tsx` - Modal/panel for displaying data quality issues
- `src/components/ErrorReport/ErrorReport.test.tsx` - Unit tests for ErrorReport
- `src/components/Loading/LoadingSpinner.tsx` - Loading state indicator
- `src/hooks/useBalloonData.ts` - Custom hook for managing balloon data state
- `src/hooks/useWindData.ts` - Custom hook for managing wind data state
- `src/hooks/useAutoRefresh.ts` - Custom hook for auto-refresh functionality
- `src/hooks/useThrottle.ts` - Custom hook for throttling function calls
- `src/hooks/useDebounce.ts` - Custom hook for debouncing function calls
- `src/context/DataContext.tsx` - React context for global data state management
- `.env` - Environment variables (if needed)
- `.gitignore` - Git ignore patterns
- `README.md` - Project documentation and setup instructions
- `vercel.json` or `netlify.toml` - Deployment configuration

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MapView.tsx` and `MapView.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Consider using React Testing Library for component tests and Jest for utility function tests.

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/windborne-balloon-visualization`)

- [x] 1.0 Project setup and configuration
  - [x] 1.1 Initialize React project with TypeScript using Vite or Create React App
  - [x] 1.2 Install core dependencies: React, ReactDOM, TypeScript
  - [x] 1.3 Install mapping library (Leaflet with @types/leaflet or Mapbox GL JS)
  - [x] 1.4 Install HTTP client library (axios or use native fetch)
  - [x] 1.5 Install additional utilities: date-fns or moment for time handling
  - [x] 1.6 Configure TypeScript with appropriate compiler options
  - [x] 1.7 Set up project folder structure (src/components, src/services, src/utils, src/types, src/hooks)
  - [x] 1.8 Configure build tool and development server
  - [x] 1.9 Set up testing framework (Jest + React Testing Library)
  - [x] 1.10 Create initial .gitignore file
  - [x] 1.11 Update README.md with project description and setup instructions

- [x] 2.0 Data ingestion and track reconstruction
  - [x] 2.1 Create TypeScript types for balloon position data (`src/types/balloon.ts`)
  - [x] 2.2 Create TypeScript types for track data (`src/types/track.ts`)
  - [x] 2.3 Create WindBorne API service (`src/services/windborneApi.ts`)
  - [x] 2.4 Implement function to fetch single endpoint (e.g., `fetchBalloonData(hour: number)`)
  - [x] 2.5 Implement function to fetch all 24 endpoints in parallel with error handling
  - [x] 2.6 Add robust JSON parsing with try-catch for corrupted data
  - [x] 2.7 Create data validation function to ensure coordinate format is correct
  - [x] 2.8 Track which endpoints succeeded/failed for error reporting
  - [x] 2.9 Create distance calculation utility (`src/utils/distance.ts`) for great-circle distance
  - [x] 2.10 Implement proximity matching algorithm (`src/utils/trackReconstruction.ts`)
  - [x] 2.11 Add distance threshold gating (max 300-800 km per hour movement)
  - [x] 2.12 Add altitude change threshold (max 3-8 km altitude change per hour)
  - [x] 2.13 Implement global assignment logic (greedy matching or Hungarian algorithm) to prevent identity swaps
  - [x] 2.14 Handle edge cases: balloons appearing/disappearing, assign new track IDs
  - [x] 2.15 Create function to reconstruct complete tracks from matched points
  - [x] 2.16 Add track metadata calculation (start time, end time, duration, etc.)
  - [x] 2.17 Write unit tests for track reconstruction algorithm
  - [x] 2.18 Write unit tests for WindBorne API service

- [x] 3.0 Open-Meteo integration and wind data correlation
  - [x] 3.1 Create TypeScript types for wind data (`src/types/wind.ts`)
  - [x] 3.2 Create Open-Meteo API service (`src/services/openMeteoApi.ts`)
  - [x] 3.3 Implement altitude to pressure level mapping utility (`src/utils/altitudeMapping.ts`)
  - [x] 3.4 Create mapping function: altitude (km) → pressure level (hPa) for Open-Meteo queries
  - [x] 3.5 Implement function to fetch wind data for a specific location and pressure level
  - [x] 3.6 Implement function to fetch historical wind data (past 24 hours) for a location
  - [x] 3.7 Add wind data caching mechanism to reduce redundant API calls
  - [x] 3.8 Create function to correlate wind vectors with balloon positions at corresponding timestamps
  - [x] 3.9 Implement 1-hour nowcast prediction logic (`src/utils/nowcast.ts`)
  - [x] 3.10 Calculate predicted position using current wind vector at balloon's altitude
  - [x] 3.11 Add uncertainty calculation for nowcast (based on wind variability if available)
  - [x] 3.12 Write unit tests for altitude mapping utility
  - [x] 3.13 Write unit tests for Open-Meteo API service
  - [x] 3.14 Write unit tests for nowcast prediction logic

- [ ] 4.0 Map visualization and user interface
  - [x] 4.1 Set up map library and create base MapView component (`src/components/Map/MapView.tsx`)
  - [x] 4.2 Configure map with world view, appropriate zoom level, and lat/lon grid overlay
  - [x] 4.3 Create TrackLayer component to render balloon tracks as colored paths
  - [x] 4.4 Implement altitude-based color encoding (blue → green → yellow → red gradient)
  - [x] 4.5 Create MarkerLayer component to render current balloon positions as markers
  - [x] 4.6 Style markers to indicate altitude (size or visual style)
  - [x] 4.7 Create WindLayer component to render wind vectors/arrows
  - [x] 4.8 Implement wind vector visualization with direction and speed indication
  - [x] 4.9 Create BalloonSelector dropdown component (`src/components/Controls/BalloonSelector.tsx`)
  - [x] 4.10 Populate dropdown with "All Balloons" option and individual track IDs
  - [x] 4.11 Create TimeSelector component (`src/components/Controls/TimeSelector.tsx`)
  - [x] 4.12 Populate time selector with "Full 24h History" and hourly options ("Now", "1h ago", etc.)
  - [x] 4.13 Implement track filtering logic based on selected balloon
  - [x] 4.14 Implement time filtering logic (show full path or snapshot at selected time)
  - [x] 4.15 Create DetailsPanel component (`src/components/DetailsPanel/DetailsPanel.tsx`)
  - [x] 4.16 Display current position (lat, lon), altitude, wind speed/direction in details panel
  - [x] 4.17 Calculate and display track statistics: distance traveled, average speed, altitude range
  - [x] 4.18 Add wind layer transition detection and display count
  - [x] 4.19 Implement click/hover interactions on tracks and markers to show details
  - [x] 4.20 Create main App component layout with map, controls, and details panel
  - [x] 4.21 Style components with appropriate colors, spacing, and professional appearance
  - [x] 4.22 Add smooth transitions when switching between views
  - [x] 4.23 Implement nowcast visualization (predicted positions with uncertainty indicators)
  - [x] 4.24 Write unit tests for key UI components

- [ ] 5.0 Refresh functionality and error handling
  - [x] 5.1 Create custom hook for throttling (`src/hooks/useThrottle.ts`)
  - [x] 5.2 Create custom hook for debouncing (`src/hooks/useDebounce.ts`)
  - [x] 5.3 Create custom hook for auto-refresh (`src/hooks/useAutoRefresh.ts`)
  - [x] 5.4 Implement auto-refresh timer (5-10 minute interval)
  - [x] 5.5 Create RefreshButton component (`src/components/Controls/RefreshButton.tsx`)
  - [x] 5.6 Implement manual refresh functionality with throttling (30 second minimum)
  - [x] 5.7 Add debouncing to refresh button to handle rapid clicks
  - [x] 5.8 Create LoadingSpinner component (`src/components/Loading/LoadingSpinner.tsx`)
  - [x] 5.9 Implement loading states during data fetching operations
  - [x] 5.10 Create error tracking system to record data quality issues
  - [x] 5.11 Track which data files failed to load
  - [x] 5.12 Track which balloons have incomplete tracks
  - [x] 5.13 Track API errors and rate limiting issues
  - [x] 5.14 Create ErrorReport component (`src/components/ErrorReport/ErrorReport.tsx`)
  - [x] 5.15 Display error report with failed files, incomplete tracks, API errors, and last successful fetch time
  - [x] 5.16 Add visual indicators (badges, icons) for missing/corrupted data in UI
  - [x] 5.17 Implement graceful degradation: show partial data when some endpoints fail
  - [x] 5.18 Add user-friendly error messages for network failures
  - [x] 5.19 Implement retry logic with exponential backoff for transient failures
  - [x] 5.20 Write unit tests for refresh functionality and error handling

- [ ] 6.0 Deployment and finalization
  - [ ] 6.1 Choose deployment platform (Vercel, Netlify, or similar)
  - [ ] 6.2 Configure deployment settings (build command, output directory, environment variables)
  - [ ] 6.3 Test build process locally to ensure production build works
  - [ ] 6.4 Deploy application to public URL
  - [ ] 6.5 Verify all functionality works in production environment
  - [ ] 6.6 Test auto-refresh functionality in production
  - [ ] 6.7 Test manual refresh with throttling in production
  - [ ] 6.8 Verify error handling works correctly with real API responses
  - [ ] 6.9 Test with various data scenarios (including corrupted data if possible)
  - [ ] 6.10 Update README.md with deployment URL and final project information
  - [ ] 6.11 Ensure application meets all challenge requirements:
    - [ ] 6.11.1 Application is publicly accessible (not just GitHub repo)
    - [ ] 6.11.2 Combines WindBorne data with Open-Meteo data meaningfully
    - [ ] 6.11.3 Updates dynamically with latest 24 hours of data
    - [ ] 6.11.4 Handles corrupted/undocumented data robustly
  - [ ] 6.12 Final code review and cleanup
  - [ ] 6.13 Update application POST body with final submission_url
