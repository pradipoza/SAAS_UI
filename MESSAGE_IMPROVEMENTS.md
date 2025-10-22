# Message Pages Improvements

## Overview
This document describes the improvements made to the message pages to properly fetch, parse, and display messages from the database.

## Problem Statement
The messages in the database are stored in JSON format with the following structure:
```json
{
  "type": "human",  // or "ai"
  "content": "i wanna talk to you",
  "additional_kwargs": {},
  "response_metadata": {}
}
```

Where:
- `type: "human"` = message from customer
- `type: "ai"` = reply from AI agent

The frontend was not properly parsing these JSON messages and displaying them in a user-friendly way.

## Changes Made

### 1. Backend Controller Updates (`backend/src/controllers/clientController.js`)

#### Key Improvements:
- **Session-based Grouping**: Messages are now grouped by `session_id` instead of `customer_id` to properly organize conversations
- **JSON Parsing**: Added helper functions to parse JSON message content:
  - `parseMessageContent()` - Parses string JSON or returns object
  - `getMessageText()` - Extracts text content from message object
- **Message Sorting**: Messages within conversations are sorted chronologically (oldest first)
- **Type Detection**: Properly identifies message type (`human` vs `ai`) and maps to sender (`customer` vs `bot`)
- **Enhanced Response Format**: Returns comprehensive conversation data including:
  - Session ID and customer ID
  - Properly parsed message content
  - Message type and sender identification
  - Formatted timestamps

### 2. Frontend Components

#### New Component: `MessageBubble.jsx`
A reusable component for displaying messages with:
- **Intelligent Styling**: Different colors for customer vs bot messages
- **Channel Theming**: Supports multiple color schemes (blue, green, pink, black)
- **Smart Timestamps**: Relative time formatting (e.g., "2m ago", "3h ago")
- **Avatar Icons**: Bot and User icons for visual distinction
- **Responsive Design**: Adapts to different screen sizes

#### Features:
```javascript
<MessageBubble 
  message={message} 
  channelColor="green" // whatsapp
/>
```

Color schemes:
- `green` - WhatsApp (green bot bubbles)
- `blue` - Facebook & Website (blue bot bubbles)
- `pink` - Instagram (gradient purple-pink bot bubbles)
- `black` - TikTok (black bot bubbles)

### 3. Updated Message Pages

All message pages have been updated with consistent functionality:

#### WhatsApp Messages (`WhatsAppMessages.jsx`)
- Uses green theme
- Auto-scrolls to latest message
- Proper message bubble display

#### Facebook Messages (`FacebookMessages.jsx`)
- Uses blue theme
- Consistent with WhatsApp structure

#### Instagram Messages (`InstagramMessages.jsx`)
- Uses pink gradient theme
- Matches Instagram's visual style

#### Website Messages (`WebsiteMessages.jsx`)
- Uses blue theme
- Clean, professional look

#### TikTok Messages (`TikTokMessages.jsx`)
- Uses black theme
- Aligns with TikTok's branding

#### Common Features Across All Pages:
1. **Auto-scroll**: Automatically scrolls to the bottom when new messages arrive
2. **Auto-selection**: Automatically selects the first conversation on load
3. **Empty States**: Shows helpful messages when no conversations exist
4. **Loading States**: Smooth loading animations
5. **Error Handling**: User-friendly error messages with retry options
6. **Responsive Layout**: 
   - Left sidebar: Conversation list
   - Right panel: Message view (600px height)
7. **Message Grouping**: Messages are properly grouped by session
8. **Time Formatting**: Relative timestamps (e.g., "Just now", "2h ago")

### 4. Dashboard Updates (`Dashboard.jsx`)

Enhanced recent activity section:
- **Better Title**: "Recent Messages" instead of "Recent Activity"
- **Rich Display**: Shows message icon, description, and formatted time
- **Loading States**: Skeleton loaders while fetching data
- **Empty State**: Helpful message when no recent activity exists
- **Visual Polish**: Gradient icons, hover effects, smooth transitions

## Technical Details

### Message Flow

1. **Database** → Messages stored as JSON with `type`, `content`, etc.
2. **Backend Controller** → Parses JSON, groups by session, identifies sender
3. **API Response** → Returns structured conversation data
4. **Frontend Component** → Renders using MessageBubble component

### Message Structure in Response

```javascript
{
  conversations: [
    {
      id: "session_id",
      sessionId: "session_id",
      customerId: "customer_id",
      customerName: "Customer 12345678",
      channel: "whatsapp",
      lastMessage: "i wanna talk to you",
      lastMessageTime: "2025-01-15T10:30:00Z",
      status: "active"
    }
  ],
  selectedConversation: {
    id: "session_id",
    sessionId: "session_id",
    customerId: "customer_id",
    customerName: "Customer 12345678",
    channel: "whatsapp",
    messages: [
      {
        id: 1,
        content: "i wanna talk to you",
        type: "human",
        sender: "customer",
        timestamp: "2025-01-15T10:30:00Z",
        metadata: {}
      },
      {
        id: 2,
        content: "Hello! How can I help you today?",
        type: "ai",
        sender: "bot",
        timestamp: "2025-01-15T10:30:05Z",
        metadata: {}
      }
    ]
  }
}
```

## Benefits

1. **Proper Message Display**: Messages are now displayed like in normal messaging platforms
2. **Type Distinction**: Clear visual distinction between customer and bot messages
3. **Better UX**: Auto-scroll, auto-selection, and responsive design
4. **Consistent Design**: All message pages use the same component and patterns
5. **Maintainability**: Reusable MessageBubble component reduces code duplication
6. **Scalability**: Easy to add new channels with different themes
7. **Performance**: Efficient message grouping and rendering

## Usage

### Viewing Messages
1. Navigate to any message page (WhatsApp, Facebook, Instagram, Website, TikTok)
2. Conversations are listed on the left sidebar
3. Click on a conversation to view messages
4. Messages are displayed in chronological order
5. Customer messages appear on the left (white bubbles)
6. Bot messages appear on the right (colored bubbles)

### Dashboard
1. Recent messages from all channels appear on the dashboard
2. Shows the 5 most recent interactions
3. Displays channel, customer info, and time

## Future Enhancements

Potential improvements for future iterations:
1. Real-time message updates using WebSockets
2. Message search within conversations
3. Message reactions and threading
4. File/image attachments display
5. Read receipts and typing indicators
6. Conversation archiving and filtering
7. Export conversation history
8. Multi-language support

## Testing Recommendations

1. **Load Testing**: Test with conversations containing many messages
2. **Edge Cases**: Test with empty conversations, malformed JSON
3. **Responsiveness**: Test on different screen sizes
4. **Performance**: Monitor rendering performance with large datasets
5. **Error Handling**: Test API failures and network issues

## Notes

- The backend now properly handles JSON parsing errors
- Empty or null message content is handled gracefully
- All timestamps are converted to relative time for better UX
- The message bubble component is theme-aware and responsive

---

# System Settings Plan Management

## Overview
Fixed the non-functional plan management features in the System Settings page of the admin frontend. The "Add Plan" buttons and "Save Changes" functionality now work properly with full backend API integration.

## Problem Statement

In the System Settings page:
1. **"Add Plan" buttons** for both Development and Subscription plans had no onClick handlers
2. **"Save Changes" button** showed a success message without hitting any API
3. **No backend endpoints** existed for managing plans
4. **Missing DevelopmentPlan model** in the database schema

## Changes Made

### 1. Database Schema (`backend/prisma/schema.prisma`)

#### Added DevelopmentPlan Model:
```prisma
model DevelopmentPlan {
  id          String   @id @default(cuid())
  name        String
  description String
  price       Int
  currency    String   @default("NPR")
  features    Json
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("development_plans")
}
```

#### Created Migration:
- File: `backend/prisma/migrations/20251022000000_add_development_plans/migration.sql`
- Creates the development_plans table if it doesn't exist

### 2. Backend Controller (`backend/src/controllers/adminController.js`)

#### Updated getSystemSettings:
- Now fetches both subscription and development plans from database
- Returns plans in the response along with other system settings

#### Added Plan Management Endpoints:

**Subscription Plans:**
- `createSubscriptionPlan()` - Creates new subscription plan
- `updateSubscriptionPlan()` - Updates existing subscription plan  
- `deleteSubscriptionPlan()` - Soft deletes subscription plan (marks as inactive)

**Development Plans:**
- `createDevelopmentPlan()` - Creates new development plan
- `updateDevelopmentPlan()` - Updates existing development plan
- `deleteDevelopmentPlan()` - Soft deletes development plan (marks as inactive)

### 3. Backend Routes (`backend/src/routes/admin.js`)

Added new routes for plan management:

```javascript
// Subscription Plans
router.post('/subscription-plans', createSubscriptionPlan)
router.put('/subscription-plans/:id', updateSubscriptionPlan)
router.delete('/subscription-plans/:id', deleteSubscriptionPlan)

// Development Plans
router.post('/development-plans', createDevelopmentPlan)
router.put('/development-plans/:id', updateDevelopmentPlan)
router.delete('/development-plans/:id', deleteDevelopmentPlan)
```

### 4. Frontend Updates (`admin-frontend/src/pages/SystemSettings.jsx`)

#### Added State Management:
- `showPlanModal` - Controls modal visibility
- `planModalType` - Tracks whether editing subscription or development plan
- `editingPlan` - Stores plan being edited (null for new plans)
- `planFormData` - Manages form input state

#### Added Mutations (React Query):
- `subscriptionPlanMutation` - Handles create/update of subscription plans
- `developmentPlanMutation` - Handles create/update of development plans
- `deletePlanMutation` - Handles deletion of both plan types

#### Enhanced Plan Cards:
- **Add Plan Button**: Now opens modal with correct plan type
- **Edit Button**: Opens modal with pre-filled plan data
- **Delete Button**: Confirms deletion and calls API
- **Empty State**: Shows message when no plans exist
- **Proper Display**: Shows price with currency and billing cycle

#### Added Plan Modal:
A comprehensive modal for creating/editing plans with:
- **Dynamic Title**: Shows correct plan type and action (Add/Edit)
- **Form Fields**:
  - Plan Name (required)
  - Description (required)
  - Price in NPR (required)
  - Billing Cycle (for subscription plans only)
  - Features in JSON format (optional)
- **Validation**: Required fields and JSON validation
- **Loading States**: Disabled submit button during API calls
- **Error Handling**: Shows toast messages for success/failure

#### Removed Placeholder Functionality:
- Removed non-functional "Save Changes" buttons from General Settings, Payment Settings, and Security Settings
- These sections now display settings without fake save buttons

## Technical Details

### API Endpoints

**GET** `/admin/system-settings`
- Returns system settings including subscription and development plans

**POST** `/admin/subscription-plans`
- Creates new subscription plan
- Body: `{ name, description, price, billingCycle, features }`

**PUT** `/admin/subscription-plans/:id`
- Updates existing subscription plan
- Body: `{ name?, description?, price?, billingCycle?, features?, isActive? }`

**DELETE** `/admin/subscription-plans/:id`
- Soft deletes subscription plan (sets isActive to false)

**POST** `/admin/development-plans`
- Creates new development plan
- Body: `{ name, description, price, features }`

**PUT** `/admin/development-plans/:id`
- Updates existing development plan
- Body: `{ name?, description?, price?, features?, isActive? }`

**DELETE** `/admin/development-plans/:id`
- Soft deletes development plan (sets isActive to false)

### Plan Data Structure

**Subscription Plan:**
```javascript
{
  id: "cuid...",
  name: "Basic Plan",
  description: "Perfect for small businesses",
  price: 5000,
  currency: "NPR",
  billingCycle: "monthly",
  features: {
    "messages": 1000,
    "channels": 2,
    "support": "Email"
  },
  isActive: true,
  createdAt: "2025-01-15T10:30:00Z",
  updatedAt: "2025-01-15T10:30:00Z"
}
```

**Development Plan:**
```javascript
{
  id: "cuid...",
  name: "Custom Chatbot",
  description: "Full chatbot development service",
  price: 50000,
  currency: "NPR",
  features: {
    "channels": "unlimited",
    "customization": "full",
    "support": "24/7"
  },
  isActive: true,
  createdAt: "2025-01-15T10:30:00Z",
  updatedAt: "2025-01-15T10:30:00Z"
}
```

## Benefits

1. **Functional Plan Management**: Admins can now create, edit, and delete plans
2. **Database Integration**: All changes are persisted to the database
3. **Real-time Updates**: UI refreshes automatically after changes
4. **User Feedback**: Toast notifications for all actions
5. **Data Validation**: Form validation prevents invalid data
6. **Soft Deletes**: Plans are marked inactive instead of hard deleted
7. **Flexible Features**: JSON format allows for dynamic feature sets
8. **Professional UI**: Modal-based editing with clean design

## Usage

### Creating a New Plan

1. Navigate to System Settings page
2. Click "Add Plan" button for either Development or Subscription plans
3. Fill in the required fields:
   - Plan Name
   - Description
   - Price (in NPR)
   - Billing Cycle (subscription plans only)
   - Features (optional, JSON format)
4. Click "Create Plan"
5. Plan appears in the list immediately

### Editing an Existing Plan

1. Find the plan in the list
2. Click the Edit icon (pencil)
3. Modify fields in the modal
4. Click "Update Plan"
5. Changes are reflected immediately

### Deleting a Plan

1. Find the plan in the list
2. Click the Delete icon (trash)
3. Confirm deletion in the browser prompt
4. Plan is removed from the list (soft deleted in database)

### Features JSON Format

Features can be structured as key-value pairs:

```json
{
  "messages": "1000/month",
  "channels": ["WhatsApp", "Facebook"],
  "storage": "5GB",
  "support": "Email only",
  "customization": false
}
```

The exact structure is flexible and can be customized based on business needs.

## Future Enhancements

1. **Plan Templates**: Pre-built templates for common plan types
2. **Feature Builder**: Visual interface for adding features instead of JSON
3. **Plan Comparison**: Side-by-side comparison view for plans
4. **Usage Analytics**: Track which plans are most popular
5. **Plan Versioning**: Keep history of plan changes
6. **Bulk Operations**: Edit multiple plans at once
7. **Plan Activation**: Easily enable/disable plans without deletion
8. **Pricing Calculator**: Help admins calculate optimal pricing

## Testing Recommendations

1. **CRUD Operations**: Test create, read, update, delete for both plan types
2. **Validation**: Test with missing required fields
3. **JSON Validation**: Test with malformed JSON in features field
4. **Concurrent Edits**: Test when multiple admins edit simultaneously
5. **Soft Delete**: Verify deleted plans are not shown but exist in database
6. **Error Handling**: Test API failures and network issues
7. **Permission Testing**: Ensure only admins can manage plans

## Notes

- All plan operations require admin authentication
- Plans are soft-deleted (isActive flag) to preserve historical data
- Features field accepts any valid JSON structure
- Price is stored in smallest currency unit (paisa for NPR)
- Billing cycle options: monthly, quarterly, yearly
- Query cache is invalidated after mutations to ensure fresh data

