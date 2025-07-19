# Sample React TypeScript Project

This is a sample React TypeScript project created to test the design system documentation generator.

## Project Structure

```
src/
├── components/
│   ├── atoms/           # Basic UI elements
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── molecules/       # Composite components
│   │   ├── Card.tsx
│   │   ├── FormField.tsx
│   │   └── Modal.tsx
│   └── organisms/       # Complex components
│       ├── Header.tsx
│       └── ProductList.tsx
├── pages/
│   └── HomePage.tsx
├── App.tsx
└── index.css
```

## Features

- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Atomic Design** component structure
- **Responsive design** with mobile-first approach
- **Dark mode support** (tokens defined)
- **Comprehensive component library**

## Components

### Atoms
- **Button**: Multiple variants (primary, secondary, success, danger, warning)
- **Input**: Form input with validation states
- **Badge**: Status indicators with different styles

### Molecules
- **Card**: Container component with different shadows and padding
- **FormField**: Input with label, error states, and helper text
- **Modal**: Overlay component with backdrop and close functionality

### Organisms
- **Header**: Navigation header with user info and notifications
- **ProductList**: Grid-based product display with filtering

### Pages
- **HomePage**: Complete page showcasing all components

## Design Tokens

The project uses a comprehensive set of design tokens including:
- **Colors**: Primary, secondary, success, danger, warning palettes
- **Spacing**: Custom spacing scale
- **Typography**: Font sizes and weights
- **Shadows**: Soft, medium, and hard shadow variations
- **Border Radius**: Multiple radius options

## Usage with Design System Doc Generator

1. **Generate snapshot**:
   ```bash
   design-system-doc snapshot --source ./src
   ```

2. **Generate documentation**:
   ```bash
   design-system-doc generate --source ./src --output ./docs
   ```

3. **Watch for changes**:
   ```bash
   design-system-doc watch --source ./src
   ```

This project serves as a comprehensive example of how the design system documentation generator works with a real React TypeScript project.