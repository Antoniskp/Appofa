# Poll/Voting System Frontend Implementation

## Summary

This implementation provides a complete frontend for the poll/voting system, following the existing codebase patterns and integrating seamlessly with the backend API at `/api/polls`.

## Files Created

### API Integration
- **`lib/api.js`** - Added `pollAPI` with methods for:
  - `getAll()` - List polls with pagination and filters
  - `getById()` - Get single poll details
  - `getResults()` - Get poll results
  - `create()` - Create new poll
  - `update()` - Update poll
  - `delete()` - Delete poll
  - `vote()` - Submit vote
  - `addOption()` - Add option to poll

### Utilities
- **`lib/utils/pollSession.js`** - Session management for unauthenticated users:
  - `getSessionId()` - Generate/retrieve session ID for anonymous voting
  - `hasVotedOnPoll()` - Check if user voted
  - `markPollAsVoted()` - Track votes in localStorage
  - `getUserVote()` - Retrieve user's vote data

### Components

#### 1. **`components/PollCard.js`**
- Reusable card component for displaying polls
- Supports both grid and list layouts
- Shows: title, description, status badge, creator, vote count
- Greek localization throughout

#### 2. **`components/PollStats.js`**
- Statistics widget showing:
  - Total votes
  - Poll status (open/closed)
  - Creation date
  - Question type
- Two variants: compact and detailed

#### 3. **`components/PollResults.js`**
- Comprehensive results display with Chart.js
- Features:
  - Option breakdown with percentages and progress bars
  - Horizontal bar chart for vote distribution
  - Pie chart for visual representation
  - Auth vs unauth vote counts
  - Special handling for ranked-choice polls
- Fully responsive design

#### 4. **`components/VoteInterface.js`**
- Interactive voting interface supporting:
  - **Single-choice**: Radio buttons with images for complex polls
  - **Ranked-choice**: Reorderable list with up/down arrows
  - **Free-text**: Textarea for open responses
- Shows "Already voted" state
- Displays "Poll closed" message
- Complex poll support (images, links)

#### 5. **`components/PollForm.js`**
- Comprehensive form for creating/editing polls
- Features:
  - Title and description fields
  - Poll type selection (simple/complex)
  - Question type (single-choice/ranked-choice/free-text)
  - Allow unauthenticated voting checkbox
  - Allow user-added options checkbox
  - Dynamic option management (add/remove)
  - Conditional fields based on poll type
  - Validation (title required, min 2 options)
- Complex poll options include:
  - Text
  - Display name
  - Image URL
  - Link URL

### Pages

#### 1. **`app/polls/page.js`** - Poll Listing Page
- Grid/list view toggle
- Filters by status (open/closed)
- "My Polls" filter for authenticated users
- Pagination
- Empty state with call-to-action
- Loading skeletons
- Error handling
- "Create Poll" button for authenticated users

#### 2. **`app/polls/create/page.js`** - Poll Creation Page
- Protected route (requires authentication)
- Uses PollForm component
- Toast notifications for success/error
- Redirects to poll detail after creation

#### 3. **`app/polls/[id]/page.js`** - Poll Detail/Voting Page
- Two-column layout:
  - **Main area**: Poll header, voting interface or results
  - **Sidebar**: Stats widget, poll information
- Features:
  - Shows voting interface if poll is open and user hasn't voted
  - Shows results if user voted or poll is closed
  - Edit/delete buttons for creator/admin
  - Confirmation dialog before deletion
  - Session tracking for anonymous users
  - Real-time vote submission
  - Auto-refresh results after voting

### Navigation Updates

#### **`components/TopNav.js`**
Updated both desktop and mobile navigation:
- Added "Ψηφοφορίες" (Polls) link to main nav (between News and Locations)
- Added "Δημιουργία Ψηφοφορίας" (Create Poll) to user dropdown menu
- Imported `PlusCircleIcon` for create poll action

## Features Implemented

### ✅ Core Functionality
- Poll listing with filters and pagination
- Poll creation with comprehensive form
- Poll detail view with voting
- Real-time results visualization
- Edit/delete poll (creator/admin only)

### ✅ Poll Types
- **Simple polls**: Text-only options
- **Complex polls**: Options with images and links

### ✅ Question Types
- **Single-choice**: One option selection
- **Ranked-choice**: Order preferences with drag controls
- **Free-text**: Open text responses

### ✅ User Experience
- Loading states with skeleton loaders
- Error messages with alerts
- Success toasts for actions
- Confirmation dialogs for destructive actions
- Empty states with helpful messages
- Responsive design (mobile-first)

### ✅ Authentication
- Authenticated user voting (tracked by backend)
- Unauthenticated voting with session IDs (localStorage)
- Vote tracking to prevent duplicate votes
- Role-based permissions (creator/admin can edit/delete)

### ✅ Visualization
- Chart.js integration for results
- Horizontal bar charts
- Pie charts
- Progress bars for options
- Percentage calculations
- Auth vs unauth vote breakdown

### ✅ Greek Localization
All UI text is in Greek:
- "Ψηφοφορίες" (Polls)
- "Δημιουργία Ψηφοφορίας" (Create Poll)
- "Ανοιχτή" (Open) / "Κλειστή" (Closed)
- "Υποβολή Ψήφου" (Submit Vote)
- And all other interface elements

## Technical Details

### Dependencies Used
- **Chart.js** (v4.5.1): Data visualization
- **react-chartjs-2** (v5.3.1): React wrapper for Chart.js
- All other components use existing libraries

### State Management
- React hooks (useState, useEffect)
- Custom hooks: useAsyncData, useFilters, useAuth, usePermissions, useToast

### Styling
- Tailwind CSS (consistent with existing components)
- Existing color scheme (blue-600 primary, gray for neutral)
- Responsive grid layouts
- Hover effects and transitions

### API Integration
- RESTful API calls to `/api/polls`
- Error handling with try/catch
- Loading states
- Success/error toast notifications

### Data Persistence
- Backend persistence for authenticated users
- localStorage for unauthenticated user session tracking
- Vote history in localStorage

## Responsive Design
All pages and components are mobile-responsive:
- Breakpoints: sm, md, lg
- Grid layouts collapse on mobile
- Touch-friendly buttons and controls
- Readable text sizes on all devices

## Accessibility
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus states on interactive elements
- Screen reader friendly

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript features
- CSS Grid and Flexbox

## Testing Recommendations

### Manual Testing
1. Create a poll (authenticated)
2. Vote on a poll (authenticated and unauthenticated)
3. View results
4. Edit/delete own poll
5. Filter polls by status
6. Test on mobile devices
7. Test all question types

### Edge Cases to Test
- Voting twice (should be prevented)
- Poll with no votes
- Poll with many options
- Very long poll titles/descriptions
- Network errors during voting
- Unauthenticated user voting on restricted polls

## Future Enhancements (Not Implemented)
- Poll edit page (route exists but page not created)
- Real-time result updates (WebSocket)
- Poll expiration/scheduling
- Advanced analytics
- Export results
- Poll templates
- Social sharing

## Notes
- All Greek text follows existing localization patterns
- Component structure mirrors ArticleCard/ArticleForm patterns
- Uses existing UI components (Button, Badge, Modal, etc.)
- Follows Next.js 13+ App Router conventions
- Chart.js already installed in package.json
