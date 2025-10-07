# Grid API Integration

This document describes the Grid API integration implemented in the PWA.

## Overview

The application now supports fetching and displaying product categories using a grid-based structure from the backend API endpoint `/b2b/v1/grids/get`.

## Grid API Structure

### Endpoint
```
POST /b2b/v1/grids/get
```

### Required Headers
- `X-Company-ID`: Company identifier
- `X-Merchant-Name`: Merchant name
- `Authorization`: Bearer token (optional)

### Request Body
```json
{}
```
Empty JSON object as per OpenAPI specification.

### Response Structure
```json
{
  "id": "string",
  "title": "string (optional)",
  "groups": [
    {
      "id": "string",
      "title": "string",
      "image_url_template": "string (optional)",
      "categories": [
        {
          "id": "string",
          "title": "string",
          "image_url_": "string (optional)"
        }
      ]
    }
  ]
}
```

## Implementation Details

### Components

#### 1. GridView Component (`src/components/GridView.js`)
- Displays the grid structure with groups and categories
- Shows all groups with their categories in a responsive layout
- Handles category selection and navigation to products
- Includes loading, error, and empty states

#### 2. Updated App Component (`src/App.js`)
New state management:
- `gridData`: Stores the grid response from API
- `companyId`: Company ID for X-Company-ID header
- `merchantName`: Merchant name for X-Merchant-Name header
- `useGridView`: Toggle between grid view and category view

#### 3. Updated BottomPanel (`src/components/BottomPanel.js`)
New settings fields:
- Grid View toggle checkbox
- Company ID input field
- Merchant Name input field

### API Functions

#### fetchGrids (`src/utils/api.js`)
```javascript
fetchGrids(baseUrl, authToken, companyId, merchantName)
```
Fetches grid data with required headers.

#### useApi Hook (`src/hooks/useApi.js`)
```javascript
api.getGrids(companyId, merchantName)
```
Wrapper for fetchGrids with loading state management.

## Usage

### Enabling Grid View

1. Open the app
2. Click on **Settings** (⚙️) in the bottom panel
3. Enable **"Использовать реальный API"** checkbox
4. Enable **"Использовать Grid View"** checkbox
5. Configure the following fields:
   - **URL API бекенда**: Your backend API URL
   - **Токен авторизации**: Your auth token (optional)
   - **Company ID**: Your company identifier
   - **Merchant Name**: Your merchant name
6. Click **"Сохранить"**
7. Select a store from the store selector
8. The grid will be automatically loaded

### Grid View Behavior

When Grid View is enabled:
- The main view displays **groups** of categories
- Each group shows its title and optional image
- Categories within each group are displayed in a grid layout
- Clicking on a category navigates to its products
- Products can be added to the cart as usual

### Fallback Mechanism

If the grid API returns a 404 error (grid not found), the app automatically falls back to the standard category view.

## UI Features

### Grid Layout
- **Groups**: Displayed in vertical sections with headers
- **Categories**: Displayed in a responsive grid (auto-fill minmax)
- **Responsive**: Adapts to mobile, tablet, and desktop screens

### Visual Elements
- Group headers with titles and optional images
- Category cards with images and titles
- Hover effects on category cards
- Loading spinner during data fetch
- Error state with clear messaging
- Empty state when no data available

## Development

### Testing the Grid API

You can test with mock data by:
1. Setting up a local API server responding to `/b2b/v1/grids/get`
2. Ensuring proper CORS headers are set
3. Returning the expected JSON structure

Example mock response:
```json
{
  "id": "main-grid",
  "title": "Grocery Grid",
  "groups": [
    {
      "id": "group-1",
      "title": "Food",
      "categories": [
        {
          "id": "cat-1",
          "title": "Pizza"
        },
        {
          "id": "cat-2",
          "title": "Burgers"
        }
      ]
    },
    {
      "id": "group-2",
      "title": "Drinks",
      "categories": [
        {
          "id": "cat-3",
          "title": "Soft Drinks"
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Grid not loading
- Ensure Company ID and Merchant Name are filled in settings
- Check that the API URL is correct
- Verify auth token if required
- Check browser console for error messages

### CORS Issues
- Configure CORS on your backend server
- Use a proxy server for development
- Check that all required headers are allowed

### 404 Error
- Verify the endpoint `/b2b/v1/grids/get` exists on your backend
- Check that Company ID and Merchant Name are valid
- The app will automatically fall back to category view

## Files Modified/Created

### New Files
- `src/components/GridView.js` - Grid display component
- `src/components/GridView.css` - Grid styling
- `backend_schemas/api/grid.yaml` - OpenAPI schema (reference)
- `backend_schemas/definitions.yaml` - Common definitions (reference)

### Modified Files
- `src/App.js` - Added grid state and logic
- `src/components/BottomPanel.js` - Added grid settings
- `src/utils/api.js` - Added fetchGrids function
- `src/hooks/useApi.js` - Added getGrids method

## API Schema Reference

The grid API follows the OpenAPI 3.0 specification defined in:
- `backend_schemas/api/grid.yaml`
- `backend_schemas/definitions.yaml`

These files document the complete API contract including:
- Request/response schemas
- Required headers
- Error responses
- Data types and validation

