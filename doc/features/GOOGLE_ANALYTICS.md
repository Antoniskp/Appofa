# Google Analytics Integration Guide

This guide explains how to use the Google Analytics integration in the application.

## Setup

1. **Get your Google Analytics Measurement ID:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property or use an existing one
   - Find your Measurement ID (format: `G-XXXXXXXXXX`)

2. **Configure the application:**
   - Add your Measurement ID to the `.env` file:
     ```
     NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
     ```

3. **Restart the application:**
   - The Google Analytics script will be automatically loaded
   - Page views will be tracked automatically on route changes

## Automatic Tracking

The application automatically tracks:
- **Page views**: Every time a user navigates to a new page
- **Route changes**: Including client-side navigation in the Next.js app

## Custom Event Tracking

You can track custom events in your components:

```javascript
import { trackEvent } from '@/lib/analytics';

// Track a button click
const handleButtonClick = () => {
  trackEvent('button_click', {
    category: 'engagement',
    label: 'signup_button',
    value: 1
  });
};

// Track article submission
const handleArticleSubmit = () => {
  trackEvent('article_submit', {
    category: 'content',
    label: 'news_article'
  });
};

// Track user login
const handleLogin = () => {
  trackEvent('login', {
    category: 'authentication',
    label: 'standard_login'
  });
};
```

## Available Functions

### `trackEvent(action, params)`

Track a custom event.

**Parameters:**
- `action` (string): The event action (e.g., 'click', 'submit', 'login')
- `params` (object, optional): Event parameters
  - `category` (string): Event category
  - `label` (string): Event label
  - `value` (number): Event value

**Example:**
```javascript
trackEvent('purchase', {
  category: 'ecommerce',
  label: 'premium_subscription',
  value: 9.99
});
```

### `trackPageView(url)`

Manually track a page view (not usually needed as automatic tracking is enabled).

**Parameters:**
- `url` (string): The URL to track

**Example:**
```javascript
trackPageView('/custom-page');
```

### `isGAEnabled()`

Check if Google Analytics is configured and enabled.

**Returns:** Boolean

**Example:**
```javascript
if (isGAEnabled()) {
  console.log('Google Analytics is active');
}
```

## Privacy Considerations

- Google Analytics is only loaded when a Measurement ID is configured
- All data is sent to Google's servers according to their privacy policy
- Consider adding a cookie consent banner if required by your jurisdiction
- Users can block Google Analytics using browser extensions

## Testing

To verify Google Analytics is working:

1. **Using Google Analytics Real-Time Reports:**
   - Open Google Analytics
   - Go to Reports > Real-time
   - Navigate through your app
   - You should see your visits appearing in real-time

2. **Using Browser Developer Tools:**
   - Open DevTools (F12)
   - Go to the Network tab
   - Filter by "google-analytics.com"
   - Navigate through the app
   - You should see requests being sent to Google Analytics

3. **Using Google Tag Assistant:**
   - Install the [Tag Assistant Chrome extension](https://tagassistant.google.com/)
   - Visit your site
   - The extension will show if GA tags are firing correctly

## Disabling Google Analytics

To disable Google Analytics:
- Remove or comment out the `NEXT_PUBLIC_GA_MEASUREMENT_ID` from your `.env` file
- Restart the application

The GoogleAnalytics component will not load the script if no Measurement ID is configured.
