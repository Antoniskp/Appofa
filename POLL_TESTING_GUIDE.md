# Poll Frontend Implementation - Testing Guide

## Quick Start

### 1. Navigate to Polls
- Go to http://localhost:3001/polls (or your frontend URL)
- You should see the polls listing page

### 2. View Available Polls
The listing page shows:
- Poll cards in grid or list view (toggle button at top right)
- Filter by status (Open/Closed)
- "My Polls" checkbox (for authenticated users)
- Pagination if there are many polls

### 3. Create a Poll (Requires Login)
1. Click "Δημιουργία Ψηφοφορίας" button
2. Fill in the form:
   - **Title**: Required, 3-200 characters
   - **Description**: Optional, up to 1000 characters
   - **Poll Type**: Simple (text only) or Complex (with images/links)
   - **Question Type**: 
     - Single-choice (radio buttons)
     - Ranked-choice (order preferences)
     - Free-text (open response)
   - **Allow unauthenticated voting**: Checkbox
   - **Allow users to add options**: Checkbox
   - **Options**: At least 2 required
3. Click "Δημιουργία Ψηφοφορίας"
4. You'll be redirected to the poll detail page

### 4. Vote on a Poll
1. Click on any poll card
2. On the poll detail page:
   - If poll is open and you haven't voted: **Vote interface** appears
   - If you already voted or poll is closed: **Results** appear

#### Voting Methods:
- **Single-choice**: Select one option with radio buttons
- **Ranked-choice**: Use up/down arrows or enter numbers to rank options
- **Free-text**: Type your response in the textarea

3. Click "Υποβολή Ψήφου" (Submit Vote)
4. Results appear immediately after voting

### 5. View Results
Results page shows:
- Total vote count
- Option breakdown with percentages
- Progress bars for each option
- Horizontal bar chart
- Pie chart
- Auth vs unauth vote breakdown (if available)

### 6. Edit/Delete Poll (Creator or Admin only)
On poll detail page:
- Edit button (pencil icon) - Opens edit page
- Delete button (trash icon) - Opens confirmation dialog

## API Endpoints Used

All endpoints are at `/api/polls`:

```
GET    /api/polls                    - List polls
GET    /api/polls/:id                - Get poll details
GET    /api/polls/:id/results        - Get poll results
POST   /api/polls                    - Create poll
PUT    /api/polls/:id                - Update poll
DELETE /api/polls/:id                - Delete poll
POST   /api/polls/:id/vote           - Submit vote
POST   /api/polls/:id/options        - Add option
```

## Sample Data Format

### Create Poll Request:
```json
{
  "title": "Ποιο είναι το αγαπημένο σας χρώμα;",
  "description": "Βοηθήστε μας να επιλέξουμε το χρώμα για το νέο λογότυπο",
  "pollType": "simple",
  "questionType": "single-choice",
  "allowUnauthenticatedVoting": true,
  "allowUserAddOptions": false,
  "options": [
    { "optionText": "Κόκκινο" },
    { "optionText": "Μπλε" },
    { "optionText": "Πράσινο" }
  ]
}
```

### Submit Vote Request (Single-choice):
```json
{
  "optionId": 1,
  "sessionId": "session_1234567890_abc123"  // For unauthenticated users
}
```

### Submit Vote Request (Ranked-choice):
```json
{
  "optionIds": [3, 1, 2],  // Ranked from most to least preferred
  "sessionId": "session_1234567890_abc123"
}
```

### Submit Vote Request (Free-text):
```json
{
  "freeTextResponse": "Η απάντησή μου είναι...",
  "sessionId": "session_1234567890_abc123"
}
```

## Testing Checklist

### Basic Functionality
- [ ] View polls list
- [ ] Toggle between grid and list view
- [ ] Filter polls by status
- [ ] Filter "My Polls" (authenticated)
- [ ] Navigate to poll detail
- [ ] View poll information

### Poll Creation (Authenticated)
- [ ] Create simple poll with single-choice
- [ ] Create simple poll with ranked-choice
- [ ] Create simple poll with free-text
- [ ] Create complex poll with images/links
- [ ] Validation: title required
- [ ] Validation: minimum 2 options
- [ ] Validation: option text required

### Voting
- [ ] Vote as authenticated user (single-choice)
- [ ] Vote as authenticated user (ranked-choice)
- [ ] Vote as authenticated user (free-text)
- [ ] Vote as unauthenticated user
- [ ] Cannot vote twice (authenticated)
- [ ] Cannot vote twice (unauthenticated - localStorage)
- [ ] Cannot vote on closed poll
- [ ] See "Already voted" message after voting

### Results
- [ ] View results after voting
- [ ] View results of closed poll
- [ ] Bar chart displays correctly
- [ ] Pie chart displays correctly
- [ ] Percentages calculated correctly
- [ ] Auth/unauth vote breakdown shown

### Permissions
- [ ] Creator can edit their poll
- [ ] Creator can delete their poll
- [ ] Admin can edit any poll
- [ ] Admin can delete any poll
- [ ] Non-creator cannot edit others' polls
- [ ] Non-creator cannot delete others' polls

### Responsive Design
- [ ] Mobile view works correctly
- [ ] Tablet view works correctly
- [ ] Desktop view works correctly
- [ ] Navigation menu works on mobile
- [ ] Charts are responsive

### Error Handling
- [ ] Error message when poll not found
- [ ] Error message when API fails
- [ ] Loading states show correctly
- [ ] Empty state shows when no polls
- [ ] Form validation errors display

## Known Limitations

1. **Edit Page Not Implemented**: The edit route exists (`/polls/[id]/edit`) but the page component was not created. The edit button will show a 404.

2. **Session ID Limitation**: Unauthenticated users can vote multiple times by clearing localStorage or using different browsers. This is by design for simplicity.

3. **No Real-time Updates**: Results don't update in real-time if other users vote. Refresh the page to see updated results.

4. **Ranked-choice Limitations**: The UI uses arrow buttons instead of drag-and-drop (would require additional library).

## Browser Testing

Test on:
- Chrome/Edge (Chromium)
- Firefox
- Safari (if available)
- Mobile browsers (iOS Safari, Chrome Android)

## localStorage Keys Used

```
poll_session_id        - Anonymous user session ID
voted_polls            - JSON object tracking which polls user voted on
```

Example voted_polls:
```json
{
  "1": {
    "votedAt": "2024-02-07T10:30:00.000Z",
    "optionId": 2
  },
  "2": {
    "votedAt": "2024-02-07T11:15:00.000Z",
    "freeTextResponse": "Η απάντησή μου"
  }
}
```

## Troubleshooting

### "Poll not found" error
- Check that the backend is running
- Verify the poll exists in the database
- Check browser console for API errors

### Vote not submitting
- Check browser console for errors
- Verify the API endpoint `/api/polls/:id/vote` is working
- Check that session ID is being generated (localStorage)

### Charts not displaying
- Verify Chart.js is loaded (check browser console)
- Check that results data is in correct format
- Try refreshing the page

### Already voted but can't see results
- Check localStorage for `voted_polls` key
- Clear localStorage and try again
- Check if userVotes array is returned from API

## Next Steps / Future Enhancements

1. **Implement Edit Page**: Create `/app/polls/[id]/edit/page.js`
2. **Add Poll Scheduling**: Start and end dates for polls
3. **Export Results**: CSV/PDF download
4. **Real-time Updates**: WebSocket or polling for live results
5. **Advanced Analytics**: Vote patterns, demographics
6. **Poll Templates**: Pre-configured poll types
7. **Social Sharing**: Share poll on social media
8. **Notifications**: Email notifications for poll creators
9. **Poll Categories**: Organize polls by category
10. **Search**: Full-text search for polls

## Support

For issues or questions:
1. Check browser console for errors
2. Verify backend API is running
3. Check database has poll data
4. Review POLL_FRONTEND_IMPLEMENTATION.md for details
