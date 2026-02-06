# DropdownMenu Component - Usage Examples

The `DropdownMenu` component is a comprehensive, reusable dropdown menu with full accessibility support, keyboard navigation, and smooth animations.

## Features

- ✅ Automatic click-outside-to-close functionality
- ✅ Full keyboard navigation (Arrow keys, Enter, Escape, Home, End)
- ✅ Support for icons, dividers, and disabled items
- ✅ Customizable alignment (left, right, center)
- ✅ Full accessibility (ARIA attributes, focus management)
- ✅ Smooth animations
- ✅ Support for custom trigger elements

## Basic Usage

### Simple Dropdown with Default Trigger

```jsx
import DropdownMenu from '@/components/DropdownMenu';

function MyComponent() {
  const menuItems = [
    {
      id: 'option1',
      label: 'Option 1',
      onClick: () => console.log('Option 1 clicked')
    },
    {
      id: 'option2',
      label: 'Option 2',
      onClick: () => console.log('Option 2 clicked')
    }
  ];

  return (
    <DropdownMenu
      triggerText="Actions"
      items={menuItems}
      align="right"
    />
  );
}
```

### Dropdown with Link Items

```jsx
import DropdownMenu from '@/components/DropdownMenu';
import { UserCircleIcon, SettingsIcon } from '@heroicons/react/24/outline';

function UserMenu() {
  const userMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: <UserCircleIcon className="h-4 w-4" />
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: <SettingsIcon className="h-4 w-4" />
    }
  ];

  return (
    <DropdownMenu
      triggerText="User Menu"
      items={userMenuItems}
      showChevron={true}
    />
  );
}
```

### Dropdown with Dividers and Danger Actions

```jsx
import DropdownMenu from '@/components/DropdownMenu';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

function ArticleActions({ onEdit, onDelete }) {
  const items = [
    {
      id: 'edit',
      label: 'Edit',
      icon: <PencilIcon className="h-4 w-4" />,
      onClick: onEdit
    },
    { divider: true },
    {
      id: 'delete',
      label: 'Delete',
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'danger'
    }
  ];

  return (
    <DropdownMenu
      triggerText="Actions"
      items={items}
    />
  );
}
```

### Custom Trigger Element

```jsx
import DropdownMenu from '@/components/DropdownMenu';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

function ActionsDropdown() {
  const items = [
    { id: 'view', label: 'View', href: '/view' },
    { id: 'edit', label: 'Edit', onClick: () => {} }
  ];

  return (
    <DropdownMenu
      trigger={
        <button className="p-2 hover:bg-gray-100 rounded">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      }
      items={items}
      align="left"
    />
  );
}
```

### Disabled Items

```jsx
import DropdownMenu from '@/components/DropdownMenu';

function MenuWithDisabledItems() {
  const items = [
    {
      id: 'available',
      label: 'Available Action',
      onClick: () => console.log('Clicked')
    },
    {
      id: 'disabled',
      label: 'Disabled Action',
      onClick: () => console.log('Should not trigger'),
      disabled: true
    }
  ];

  return (
    <DropdownMenu
      triggerText="Menu"
      items={items}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `trigger` | React.ReactNode | - | Custom trigger element (button, link, etc.) |
| `triggerText` | string | 'Menu' | Text for default trigger button (if no custom trigger) |
| `triggerClassName` | string | '' | Additional classes for default trigger |
| `showChevron` | boolean | true | Show chevron icon on default trigger |
| `items` | Array | [] | Array of menu items (see Item Props below) |
| `align` | string | 'right' | Menu alignment: 'left', 'right', 'center' |
| `menuClassName` | string | '' | Additional classes for menu container |
| `menuId` | string | auto-generated | ID for menu |
| `onOpenChange` | function | - | Callback when menu open state changes |

## Item Props

Each item in the `items` array can have the following properties:

| Prop | Type | Description |
|------|------|-------------|
| `id` | string | Unique identifier for the item |
| `label` | string | Text to display |
| `href` | string | Link URL (renders as Link component) |
| `onClick` | function | Click handler (renders as button) |
| `icon` | React.ReactNode | Icon element to display before label |
| `disabled` | boolean | Whether the item is disabled |
| `variant` | string | 'danger' for red text styling |
| `className` | string | Additional CSS classes |
| `divider` | boolean | Set to true to render a divider instead of item |

## Keyboard Navigation

- **Arrow Down**: Move focus to next item
- **Arrow Up**: Move focus to previous item
- **Home**: Move focus to first item
- **End**: Move focus to last item
- **Enter/Space**: Activate focused item
- **Escape**: Close menu and return focus to trigger

## Accessibility

The component includes full ARIA support:
- `role="menu"` on the menu container
- `role="menuitem"` on each item
- `aria-haspopup="true"` on the trigger
- `aria-expanded` state on the trigger
- `aria-controls` linking trigger to menu
- `aria-disabled` on disabled items
- Proper focus management
- Screen reader announcements

## Integration Example (from TopNav.js)

```jsx
import DropdownMenu from '@/components/DropdownMenu';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

function TopNav() {
  const { user, logout } = useAuth();
  const { isAdmin } = usePermissions();

  const userMenuItems = [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: <UserCircleIcon className="h-4 w-4" />
    },
    ...(isAdmin ? [{
      id: 'admin',
      label: 'Admin',
      href: '/admin',
      icon: <ShieldCheckIcon className="h-4 w-4" />
    }] : []),
    { divider: true },
    {
      id: 'logout',
      label: 'Logout',
      icon: <ArrowRightOnRectangleIcon className="h-4 w-4" />,
      onClick: logout,
      variant: 'danger'
    }
  ];

  return (
    <DropdownMenu
      triggerText={`Hello ${user.username}`}
      items={userMenuItems}
      align="right"
      showChevron={true}
    />
  );
}
```

## Benefits

1. **DRY Principle**: Eliminates ~160+ lines of duplicate dropdown logic across the application
2. **Consistency**: All dropdowns behave and look the same
3. **Accessibility**: Full WCAG compliance out of the box
4. **Maintainability**: Single source of truth for dropdown behavior
5. **Developer Experience**: Simple API, easy to use
6. **Performance**: Optimized with proper React hooks and memoization

## Testing

The component handles:
- Click outside to close
- Keyboard navigation
- Focus management
- Proper event handling
- Screen reader support
- Mobile touch events
- Edge cases (empty items, all disabled, etc.)
