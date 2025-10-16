# Message UI Design Guide

## Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  📱 WhatsApp Messages                            🔄 Refresh      │
│  Chat conversations from WhatsApp Business                       │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search conversations...              [All Status ▼]         │
├───────────────────────┬─────────────────────────────────────────┤
│                       │                                           │
│  Conversations        │  Selected Conversation                   │
│  (Left Sidebar)       │  (Main Chat Area)                        │
│                       │                                           │
│  ┌─────────────────┐ │  ┌─────────────────────────────────────┐ │
│  │ 📞 Customer A   │ │  │ Customer A                    [...]  │ │
│  │ Hello, I need...│ │  ├─────────────────────────────────────┤ │
│  │ 2h ago          │ │  │                                     │ │
│  │ [active]        │ │  │  ┌──────────────────┐              │ │
│  └─────────────────┘ │  │  │👤 Customer:       │              │ │
│                       │  │  │ Hello, I need    │              │ │
│  ┌─────────────────┐ │  │  │ help             │              │ │
│  │ 📞 Customer B   │ │  │  │ 2h ago           │              │ │
│  │ Can you help... │ │  │  └──────────────────┘              │ │
│  │ 5h ago          │ │  │                                     │ │
│  │ [active]        │ │  │              ┌──────────────────┐  │ │
│  └─────────────────┘ │  │              │🤖 Bot:            │  │ │
│                       │  │              │ Hi! How can I    │  │ │
│  ┌─────────────────┐ │  │              │ help you?        │  │ │
│  │ 📞 Customer C   │ │  │              │ 2h ago           │  │ │
│  │ Thank you!      │ │  │              └──────────────────┘  │ │
│  │ 1d ago          │ │  │                                     │ │
│  │ [active]        │ │  │  ┌──────────────────┐              │ │
│  └─────────────────┘ │  │  │👤 Customer:       │              │ │
│                       │  │  │ I want to buy    │              │ │
│                       │  │  │ your product     │              │ │
│                       │  │  │ 2h ago           │              │ │
│                       │  │  └──────────────────┘              │ │
│                       │  │                                     │ │
│                       │  ├─────────────────────────────────────┤ │
│                       │  │ Type your message...          [📤] │ │
│                       │  └─────────────────────────────────────┘ │
│                       │                                           │
└───────────────────────┴─────────────────────────────────────────┘
```

## Color Schemes by Channel

### WhatsApp (Green Theme)
```
Customer Messages:      Bot Messages:
┌──────────────────┐   ┌──────────────────┐
│ 👤              │   │              🤖  │
│ White background │   │ Green background │
│ Gray text        │   │ White text       │
│ Gray border      │   │ No border        │
└──────────────────┘   └──────────────────┘
```

### Facebook (Blue Theme)
```
Customer Messages:      Bot Messages:
┌──────────────────┐   ┌──────────────────┐
│ 👤              │   │              🤖  │
│ White background │   │ Blue background  │
│ Gray text        │   │ White text       │
│ Gray border      │   │ No border        │
└──────────────────┘   └──────────────────┘
```

### Instagram (Pink Gradient Theme)
```
Customer Messages:      Bot Messages:
┌──────────────────┐   ┌──────────────────┐
│ 👤              │   │              🤖  │
│ White background │   │ Purple→Pink      │
│ Gray text        │   │ White text       │
│ Gray border      │   │ No border        │
└──────────────────┘   └──────────────────┘
```

### Website (Blue Theme)
```
Customer Messages:      Bot Messages:
┌──────────────────┐   ┌──────────────────┐
│ 👤              │   │              🤖  │
│ White background │   │ Blue background  │
│ Gray text        │   │ White text       │
│ Gray border      │   │ No border        │
└──────────────────┘   └──────────────────┘
```

### TikTok (Black Theme)
```
Customer Messages:      Bot Messages:
┌──────────────────┐   ┌──────────────────┐
│ 👤              │   │              🤖  │
│ White background │   │ Black background │
│ Gray text        │   │ White text       │
│ Gray border      │   │ No border        │
└──────────────────┘   └──────────────────┘
```

## Message Bubble Structure

```javascript
MessageBubble Component:
┌────────────────────────────────────┐
│ [Avatar]  ┌──────────────────────┐ │
│   👤 or   │ Message content here │ │
│   🤖     │ Can be multi-line    │ │
│           │ text                 │ │
│           └──────────────────────┘ │
│           Timestamp (e.g. 2m ago)  │
└────────────────────────────────────┘
```

### Customer Message (Left-aligned)
```
┌─ 👤 ────────────────┐
│  Message text...    │
│  2m ago             │
└─────────────────────┘
```

### Bot Message (Right-aligned)
```
          ┌────────────── 🤖 ─┐
          │ Message text...   │
          │          2m ago   │
          └───────────────────┘
```

## Conversation List Item

```
┌─────────────────────────────────┐
│ [Icon] Customer Name  [Status]  │
│        Last message preview...  │
│        ⏰ Timestamp              │
└─────────────────────────────────┘
```

### States
- **Active**: Green badge
- **Pending**: Yellow badge
- **Resolved**: Gray badge

## Dashboard Recent Messages

```
┌──────────────────────────────────────────┐
│ Recent Messages                          │
│ Latest customer interactions...          │
├──────────────────────────────────────────┤
│ [💬] New message from Customer ABC       │
│      via WhatsApp                        │
│      ⏰ 5m ago                            │
├──────────────────────────────────────────┤
│ [💬] New message from Customer XYZ       │
│      via Instagram                       │
│      ⏰ 15m ago                           │
├──────────────────────────────────────────┤
│ [💬] New message from Customer DEF       │
│      via Website                         │
│      ⏰ 1h ago                            │
└──────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (≥1024px)
- Sidebar: 33% width (1/3 of container)
- Chat area: 67% width (2/3 of container)
- Side-by-side layout

### Tablet (768px - 1023px)
- Sidebar: 40% width
- Chat area: 60% width
- Stacked on smaller tablets

### Mobile (<768px)
- Full width for both
- Switch between list and chat view
- Back button to return to list

## Interactive States

### Hover Effects
```
Conversation Item:
Normal:   background-color: white
Hover:    background-color: light-green/blue/pink

Message Bubble:
Normal:   No hover effect
(Read-only display)

Buttons:
Normal:   background-color: primary
Hover:    background-color: primary-dark
```

### Selected States
```
Selected Conversation:
- Highlighted background (light-green/blue/pink)
- Border-right accent (2px solid)
- Active indicator
```

## Loading States

### Conversation List Loading
```
┌─────────────────────────┐
│ [●●●] ▓▓▓▓▓▓▓▓▓▓▓▓    │
│       ▓▓▓▓▓▓▓▓          │
│       ▓▓▓ ▓▓▓           │
├─────────────────────────┤
│ [●●●] ▓▓▓▓▓▓▓▓▓▓▓▓    │
│       ▓▓▓▓▓▓▓▓          │
└─────────────────────────┘
```

### Messages Loading
```
┌─────────────────────────────┐
│ [●●●] ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓     │
│       ▓▓▓▓▓▓▓▓▓             │
│                             │
│         ▓▓▓▓▓▓▓▓▓ [●●●]    │
│         ▓▓▓▓▓▓              │
└─────────────────────────────┘
```

## Empty States

### No Conversations
```
┌─────────────────────────────────┐
│                                 │
│         💬                      │
│                                 │
│   No conversations found        │
│                                 │
└─────────────────────────────────┘
```

### No Messages in Conversation
```
┌─────────────────────────────────┐
│                                 │
│         💬                      │
│                                 │
│  No messages in this            │
│  conversation yet               │
│                                 │
└─────────────────────────────────┘
```

### Select a Conversation
```
┌─────────────────────────────────┐
│                                 │
│         💬                      │
│                                 │
│  Select a conversation to       │
│  view messages                  │
│                                 │
└─────────────────────────────────┘
```

## Error States

### API Error
```
┌─────────────────────────────────┐
│                                 │
│         ⚠️                      │
│                                 │
│  Failed to load messages        │
│                                 │
│  [Try Again Button]             │
│                                 │
└─────────────────────────────────┘
```

## Timestamp Formatting

- **Just now** - Less than 1 minute
- **2m ago** - Less than 1 hour (minutes)
- **3h ago** - Less than 24 hours (hours)
- **2d ago** - Less than 7 days (days)
- **Jan 15, 10:30 AM** - More than 7 days (full date)

## Accessibility Features

1. **Semantic HTML**: Proper heading hierarchy, list structure
2. **ARIA Labels**: Screen reader friendly
3. **Keyboard Navigation**: Tab through conversations and messages
4. **Color Contrast**: WCAG AA compliant text colors
5. **Focus Indicators**: Visible focus states for interactive elements

## Animation & Transitions

1. **Smooth Scroll**: Auto-scroll to bottom with smooth behavior
2. **Hover Effects**: 200ms transition on background colors
3. **Loading Animations**: Pulse effect for skeleton loaders
4. **Message Entry**: Fade-in for new messages (optional)

## Best Practices Implemented

1. ✅ Reusable components (MessageBubble)
2. ✅ Consistent design patterns across all channels
3. ✅ Responsive layout for all screen sizes
4. ✅ Loading and error states
5. ✅ Empty states with helpful messages
6. ✅ Proper date/time formatting
7. ✅ Visual distinction between message types
8. ✅ Accessible design
9. ✅ Performance optimized (virtualization ready)
10. ✅ Theme-aware styling

