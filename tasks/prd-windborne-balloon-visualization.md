# Product Requirements Document: WindBorne Balloon Constellation Visualization

## Introduction/Overview

This application visualizes WindBorne Systems' global constellation of weather balloons by combining their live balloon position data with Open-Meteo wind data. The app reconstructs balloon flight paths from 24 hours of historical data, explains balloon motion through wind layer analysis, and provides a 1-hour nowcast prediction based on current wind conditions.

**Problem:** WindBorne's balloon API provides unordered position data without unique identifiers, making it challenging to track individual balloons over time. Additionally, understanding why balloons move in specific patterns requires correlating their positions with atmospheric wind data.

**Goal:** Create an interactive web application that robustly reconstructs balloon tracks, visualizes their 24-hour flight paths on a world map, correlates movement with wind data, and demonstrates technical skills in data processing, API integration, and visualization.

## Goals

1. Successfully ingest and process 24 hours of WindBorne balloon constellation data (00.json through 23.json)
2. Reconstruct individual balloon flight paths using proximity-based matching algorithms
3. Integrate Open-Meteo wind data to explain balloon motion patterns
4. Provide an interactive, visually compelling world map interface
5. Generate a 1-hour nowcast prediction for each balloon based on current wind conditions
6. Handle data corruption and missing data gracefully with clear user feedback
7. Deploy as a publicly accessible, live-updating web application

## User Stories

1. **As a user**, I want to see all weather balloons' positions and flight paths over the past 24 hours on a world map, so I can understand the global scope of WindBorne's constellation.

2. **As a user**, I want to select a specific balloon from a dropdown menu, so I can focus on analyzing a single balloon's journey in detail.

3. **As a user**, I want to select a specific point in time (from "now" to "23 hours ago"), so I can see where all balloons were at that moment or view a balloon's path up to that point.

4. **As a user**, I want to see wind data (speed and direction) at each balloon's current altitude, so I can understand why balloons moved in specific directions.

5. **As a user**, I want to see a 1-hour prediction of where balloons will be, so I can understand how wind-based forecasting works.

6. **As a user**, I want to be notified when data is missing or corrupted, so I understand the limitations of what's being displayed.

7. **As a user**, I want the application to automatically refresh with new data every 5-10 minutes, so I always see the most current information.

8. **As a user**, I want to manually refresh the data with a button, so I can get updates on demand without waiting for the auto-refresh.

## Functional Requirements

### Data Ingestion & Processing

1. The system must fetch balloon position data from WindBorne's API endpoints (00.json through 23.json representing current time through 23 hours ago).

2. The system must parse each JSON response as an array of coordinate triplets `[latitude, longitude, altitude_km]`.

3. The system must handle corrupted or malformed JSON responses gracefully without crashing the application.

4. The system must track which data files were successfully loaded and which failed, maintaining a record of data completeness.

5. The system must implement proximity-based matching to reconstruct individual balloon tracks across the 24-hour time series.

6. The proximity matching algorithm must:
   - Match points between consecutive hours based on physical proximity (distance in lat/lon)
   - Consider altitude changes when matching (limit unrealistic altitude jumps)
   - Handle cases where balloons disappear or new balloons appear
   - Assign unique track IDs to reconstructed balloon paths

7. The system must fetch wind data from Open-Meteo API for relevant locations and time periods.

8. The system must map balloon altitudes (in km) to appropriate Open-Meteo pressure levels (e.g., 20 km → ~50 hPa, 10 km → ~250 hPa, 2 km → ~850 hPa).

9. The system must correlate wind vectors with balloon positions at corresponding timestamps.

### User Interface

10. The system must display an interactive world map with accurate latitude and longitude grid overlay.

11. The system must provide a dropdown menu to select:
    - "All Balloons" option to show all tracks simultaneously
    - Individual balloon tracks (e.g., "Track #1", "Track #2", etc.)

12. The system must provide a dropdown menu or slider to select:
    - "Full 24h History" option to show complete tracks
    - Specific time points ("Now", "1 hour ago", "2 hours ago", ... "23 hours ago")

13. When "Full 24h History" is selected, the system must display complete flight paths for the selected balloon(s).

14. When a specific time is selected, the system must show balloon positions at that moment (or paths up to that point, depending on implementation).

15. The system must visualize balloon tracks as colored paths on the map, with color encoding altitude (e.g., blue for low altitude, red for high altitude).

16. The system must display current balloon positions as markers on the map, with size or style indicating altitude.

17. The system must show wind vectors/arrows at relevant locations to illustrate wind direction and speed.

18. When a specific balloon is selected, the system must display a details panel or overlay showing:
    - Current position (latitude, longitude)
    - Current altitude (km)
    - Wind speed and direction at that altitude
    - Time elapsed since track start
    - Total distance traveled
    - Average speed
    - Altitude range (min/max)
    - Number of wind layer transitions

19. The system must display a 1-hour nowcast prediction for each balloon, showing predicted position based on current wind conditions at the balloon's altitude.

20. The system must provide visual indicators (e.g., icons, badges, or colored borders) when data is missing or corrupted for specific balloons or time periods.

21. The system must provide an error report panel or modal that users can open to see detailed information about data quality issues.

### Data Refresh & Updates

22. The system must automatically refresh balloon data every 5-10 minutes to fetch the latest 24 hours of information.

23. The system must provide a manual refresh button that allows users to trigger data updates on demand.

24. The manual refresh button must implement throttling and debouncing safeguards to prevent excessive API calls:
    - Throttling: Limit refresh attempts to once per X seconds (e.g., 30 seconds minimum between refreshes)
    - Debouncing: Ignore rapid successive clicks, only process the last click after a delay

25. The system must display loading states during data fetching operations.

26. The system must handle API rate limits gracefully, showing appropriate messages if requests are throttled.

### Error Handling & Data Quality

27. The system must continue functioning even when some data files (e.g., 05.json, 12.json) fail to load or are corrupted.

28. The system must display partial data when available, clearly indicating what time periods or balloons are missing.

29. The system must log errors for debugging purposes while maintaining a user-friendly error presentation.

30. The system must provide an error report interface that lists:
    - Which data files failed to load
    - Which balloons have incomplete tracks
    - Any API errors encountered
    - Timestamp of last successful data fetch

## Non-Goals (Out of Scope)

1. **Mobile Responsiveness:** The initial version will be optimized for desktop/laptop screens only. Mobile device support is explicitly out of scope.

2. **Advanced Prediction Models:** Beyond the basic 1-hour wind-based nowcast, more sophisticated prediction algorithms (e.g., machine learning models, multi-hour forecasts) are out of scope.

3. **Historical Data Beyond 24 Hours:** The application focuses on the most recent 24 hours of data only. Storing or displaying older historical data is out of scope.

4. **User Authentication/Accounts:** No user accounts, login, or personalization features are required.

5. **Data Export:** Exporting data to files (CSV, JSON, etc.) is not required for the initial version.

6. **Real-time WebSocket Updates:** While auto-refresh is included, true real-time updates via WebSockets are out of scope.

7. **Multiple Map Styles/Themes:** A single map style is sufficient; theme switching is not required.

## Design Considerations

### Visual Design

- **Map Base:** Use a modern mapping library (Leaflet, Mapbox, or similar) with a clean, professional appearance suitable for scientific/technical visualization.

- **Color Scheme:** 
  - Altitude encoding: Use a color gradient (e.g., blue → green → yellow → red) to represent altitude from low to high
  - Ensure sufficient contrast for accessibility
  - Use distinct colors for different balloon tracks when showing multiple tracks

- **UI Layout:**
  - Map should occupy the primary visual space (center/main area)
  - Controls (dropdowns, refresh button) should be in a clear, accessible header or sidebar
  - Details panel should appear on selection without obscuring the map

- **Interactivity:**
  - Hover effects on balloon markers to show quick info
  - Click on tracks or markers to select and show detailed information
  - Smooth transitions when switching between views (balloon selection, time selection)

### User Experience

- **Default State:** On initial load, show "All Balloons" with "Full 24h History" to provide immediate comprehensive overview.

- **Loading States:** Show clear loading indicators during data fetches. Consider skeleton screens for better perceived performance.

- **Error Communication:** Use non-intrusive but visible indicators (e.g., badge on error report button, subtle warning icons on affected tracks).

- **Performance:** Ensure the map remains responsive even with many balloon tracks displayed. Consider performance optimizations like track simplification or viewport-based rendering if needed.

## Technical Considerations

### Technology Stack

- **Frontend:** React with TypeScript
- **Backend:** Node.js with Express (if server-side processing is needed, otherwise can be client-side only)
- **Mapping Library:** Leaflet or Mapbox GL JS (consider free tier limitations)
- **HTTP Client:** Fetch API or axios for API requests
- **State Management:** React hooks (useState, useEffect) or Context API; consider Redux if complexity grows
- **Build Tool:** Create React App, Vite, or similar
- **Deployment:** Vercel, Netlify, or similar platform for easy public hosting

### API Integration

- **WindBorne API:** 
  - Base URL: `https://a.windbornesystems.com/treasure/`
  - Endpoints: `00.json` (current) through `23.json` (23 hours ago)
  - No authentication required
  - Handle CORS if applicable
  - Expect potential data corruption - implement robust parsing

- **Open-Meteo API:**
  - Base URL: `https://api.open-meteo.com/v1/forecast`
  - No API key required
  - Supports historical data via `past_days` parameter
  - Request wind data at specific pressure levels (e.g., `wind_speed_300hPa`, `wind_direction_300hPa`)
  - Consider batching requests or using spatial bucketing to minimize API calls

### Data Processing

- **Track Reconstruction Algorithm:**
  - Implement proximity matching with distance thresholds (e.g., max 300-800 km per hour movement)
  - Consider altitude change limits (e.g., max 3-8 km altitude change per hour)
  - Use global assignment (Hungarian algorithm or greedy matching) to prevent identity swaps
  - Handle edge cases: balloons appearing/disappearing, tracks crossing, ambiguous matches

- **Wind Data Correlation:**
  - Map altitude (km) to pressure levels for Open-Meteo queries
  - Cache wind data when possible to reduce API calls
  - Align wind timestamps with balloon position timestamps

- **Nowcast Prediction:**
  - For each balloon at current time: get wind vector at balloon's lat/lon/altitude
  - Project balloon position forward 1 hour using wind velocity
  - Display prediction with uncertainty indicator (e.g., cone, circle radius)

### Performance Considerations

- **Data Fetching:** Fetch all 24 data files in parallel where possible, but handle rate limiting gracefully
- **Rendering:** Consider virtualizing or simplifying track rendering if performance becomes an issue with many balloons
- **Caching:** Cache successfully fetched data to reduce redundant API calls during refresh operations
- **Debouncing/Throttling:** Implement proper throttling on refresh button (e.g., 30-second minimum between manual refreshes)

### Error Handling Strategy

- **Network Errors:** Retry with exponential backoff for transient failures
- **Parse Errors:** Log corrupted data, skip problematic entries, continue with available data
- **API Errors:** Display user-friendly messages, maintain partial functionality
- **Data Quality:** Track which balloons/times have missing data, display indicators in UI

## Success Metrics

1. **Functional Completeness:**
   - All 24 data files can be fetched and processed
   - Balloon tracks are successfully reconstructed with reasonable accuracy
   - Wind data is correctly correlated with balloon positions
   - 1-hour nowcast predictions are generated and displayed

2. **User Experience:**
   - Application loads and displays data within acceptable time (< 10 seconds for initial load)
   - Map remains interactive and responsive during use
   - Error states are clearly communicated without breaking the user experience
   - Auto-refresh works reliably without disrupting user interaction

3. **Technical Quality:**
   - Application handles corrupted/missing data without crashing
   - API rate limits are respected (throttling/debouncing works correctly)
   - Code is maintainable and well-structured
   - Application is successfully deployed and publicly accessible

4. **Challenge Requirements Met:**
   - Application is hosted at a publicly accessible URL (not just GitHub repo)
   - Combines WindBorne data with Open-Meteo data in a meaningful way
   - Updates dynamically with latest 24 hours of data
   - Demonstrates robust handling of potentially corrupted/undocumented data

## Open Questions

1. **Track Identification:** Should tracks be labeled with generic IDs ("Track #1") or descriptive names based on location/characteristics? (Decision: Start with generic IDs, can enhance later)

2. **Wind Visualization:** Should wind vectors be shown for all balloons simultaneously, or only for the selected balloon? (Decision: Show for selected balloon by default, with option to show all if performance allows)

3. **Time Selection Behavior:** When a specific time is selected, should the system show positions at that moment only, or paths up to that point? (Decision: Show paths up to selected time for better context)

4. **Nowcast Uncertainty:** How should uncertainty in the 1-hour prediction be visualized? (Decision: Use a circle or cone around predicted position, size based on wind variability)

5. **Data Refresh Strategy:** Should auto-refresh pause when user is actively interacting with the map? (Decision: Continue auto-refresh, but ensure it doesn't disrupt current view/selection)

6. **Error Report Detail Level:** How technical should the error report be? (Decision: User-friendly summary with option to expand for technical details)

---

**Document Version:** 1.0  
**Last Updated:** [Current Date]  
**Status:** Ready for Implementation

