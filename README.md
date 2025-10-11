# Grocery PWA

A Progressive Web App for browsing and ordering grocery products.

## Features

- 📱 Progressive Web App (PWA) with offline support
- 🏪 Store selection
- 📦 Product browsing by categories
- 🎯 **Main Page Widgets** - Dynamic content organization with widgets
- 🛒 Shopping cart functionality
- 💾 Local storage persistence
- 📱 Mobile-friendly responsive design
- 🔌 Real API integration with backend services

## Live Demo

🚀 **[View Live App](https://cppfanatic.github.io/grocery/)**

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

```bash
npm install
```

### Running Locally

```bash
npm start
```

The app will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

This creates optimized files in the `dist` folder.

### Deploying to GitHub Pages

The app is automatically deployed to GitHub Pages from the `docs` folder. To update:

1. Build the production version:
   ```bash
   npm run build
   ```

2. Copy files to docs folder:
   ```bash
   cp -r dist/* docs/
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Update GitHub Pages"
   git push origin main
   ```

4. Ensure GitHub Pages is enabled in your repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main
   - Folder: /docs

## Project Structure

```
frontdemo1/
├── src/
│   ├── components/     # React components
│   ├── data/          # Mock data
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── App.js         # Main app component
│   └── index.js       # Entry point
├── public/            # Static assets
├── docs/              # GitHub Pages deployment
└── dist/              # Production build
```

## API Integration

The app integrates with backend APIs for:
- Store management
- Product categories and listings
- Main page widgets
- Order management

## Technologies

- React
- Webpack
- Service Workers (PWA)
- Local Storage API
- RESTful API integration

## License

MIT

