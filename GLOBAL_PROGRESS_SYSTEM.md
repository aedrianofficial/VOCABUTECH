# Global Progress & Level-Up System

## Overview
Implemented a global progress tracking system using React Context to ensure level-up and streak milestone popups appear consistently across the entire application, regardless of which screen the user is on.

## Problem Solved
Previously, the level-up popup only appeared on the home page because the progress logic was localized to that component. This meant users wouldn't see their achievements if they leveled up while on quiz pages, word details, flashcards, or settings screens.

## Solution Architecture

### 1. Progress Context (`app/contexts/ProgressContext.tsx`)
Created a centralized state management system that:
- **Manages Global State**: Points, level, streaks, and level progress
- **Provides Functions**: `incrementPoints()`, `loadStats()`, `incrementStreak()`, `checkAndUpdateStreak()`
- **Renders Modals Globally**: Level-up and streak milestone popups are rendered at the app root level
- **Triggers Automatically**: Popups appear immediately when conditions are met, regardless of current screen

### 2. App-Wide Integration (`app/_layout.tsx`)
Wrapped the entire app with `ProgressProvider` to make progress tracking available everywhere:
```typescript
<ProgressProvider>
  <View style={styles.container}>
    <Stack screenOptions={{ headerShown: false }}>
      {/* All screens */}
    </Stack>
    <BottomNav />
  </View>
</ProgressProvider>
```

## Updated Files

### Core System
- **`app/contexts/ProgressContext.tsx`** - New global progress context
- **`app/_layout.tsx`** - Wrapped app with ProgressProvider

### Home Screen
- **`app/home.tsx`** - Refactored to use global context instead of local state
  - Removed local `incrementPoints`, `incrementStreak`, `loadStats` functions
  - Removed level-up and streak modals (now global)
  - Uses `useProgress()` hook

### Word Details
- **`app/wordlist/details.tsx`** - Updated to use global progress
  - Removed local `incrementPoints` function
  - Uses `useProgress()` hook
  - Points awarded trigger global popups

### Quiz Pages
- **`app/quiz/easy.tsx`** - Integrated global progress
- **`app/quiz/medium.tsx`** - Integrated global progress
- **`app/quiz/hard.tsx`** - Integrated global progress
  - All quiz completions now trigger global level-up popups

### Flashcards
- **`app/flash_card.tsx`** - Integrated global progress
  - Learning words triggers global popups

## Features

### Level-Up Popup
- **Triggers**: When user crosses a level boundary (every 100 points)
- **Shows**:
  - Celebration animations with confetti
  - New level badge with glowing effect
  - Motivational message
  - Total points and progress to next level
  - Progress bar for current level
- **Appears**: On ANY screen in the app

### Streak Milestone Popup
- **Triggers**: At streak milestones (5, 10, 15, 20, 30, 50, 100 days)
- **Shows**:
  - Fire effects and streak badge
  - Consecutive days count
  - Estimated points earned
  - Motivational message for consistency
- **Appears**: On ANY screen in the app

## Usage

Any component can now access progress functions:

```typescript
import { useProgress } from './contexts/ProgressContext';

function MyComponent() {
  const { stats, levelProgress, incrementPoints, loadStats } = useProgress();
  
  // Award points - popup appears automatically if user levels up
  await incrementPoints(10);
  
  // Access current stats
  console.log(stats.points, stats.level, stats.streaks);
  console.log(levelProgress); // Progress within current level (0-100)
}
```

## Benefits

✅ **Consistent User Experience**: Rewards appear no matter where the user is
✅ **Better Engagement**: Immediate feedback reinforces gamification
✅ **Centralized Logic**: Single source of truth for progress tracking
✅ **Cleaner Code**: No duplicate logic across components
✅ **Real-time Updates**: All screens see the same stats instantly
✅ **Automatic Streak Management**: Checks and updates streaks on app load

## Technical Details

### State Management
- Uses React Context API for global state
- `useCallback` for optimized function references
- AsyncStorage for persistence

### Modal Rendering
- Modals rendered at root level (above all screens)
- Z-index ensures they appear on top
- Semi-transparent backdrop
- Tap-to-close functionality

### Point System
- Review: +5 points (once per word)
- Learned: +10 points (once per word)
- Quiz completion: Variable points
- Level up: Every 100 points

### Streak System
- Increments once per day on first activity
- Resets if user misses a day
- Milestones trigger special celebrations
- Tracks last activity date

## Testing

To test the global system:
1. Complete a quiz on the quiz screen → Level-up popup should appear
2. Mark a word as learned on word details → Level-up popup should appear
3. Add words to review on flashcards → Points update globally
4. Check stats on home screen → Shows updated values from all activities

## Future Enhancements

Potential improvements:
- Achievement badges for specific milestones
- Leaderboard integration
- Daily challenges
- Custom rewards per level
- Social sharing of achievements

