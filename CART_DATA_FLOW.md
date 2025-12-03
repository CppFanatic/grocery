# Cart Data Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MainView           CategoryView          BottomPanel          │
│  (Carousel)         (Product List)        (Cart Modal)         │
│     │                    │                      │              │
│     └────────────────────┴──────────────────────┘              │
│                          │                                      │
│                    onAddToCart()                                │
│                    onRemoveFromCart()                           │
│                    onUpdateQuantity()                           │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       APP.JS (State)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  State:                                                         │
│  • cart: []              (local cache)                          │
│  • cartId: string        (server cart ID)                       │
│  • cartVersion: number   (for concurrency control)              │
│                                                                 │
│  Functions:                                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ addToCart(product)                                     │    │
│  │ 1. Update local state (optimistic)  ────────┐         │    │
│  │ 2. Call syncCart()                          │         │    │
│  │ 3. Update from server response              │         │    │
│  └────────────────────────────────────────────┼─────────┘    │
│                                                │              │
│  ┌────────────────────────────────────────────┼─────────┐    │
│  │ syncCart(updatedCart)                      │         │    │
│  │ 1. Format items: [{id, quantity}] ◄────────┘         │    │
│  │ 2. Add store_id, fulfillment_method                  │    │
│  │ 3. Add cart id & version (if exists)                 │    │
│  │ 4. Call api.updateCart()  ──────────┐                │    │
│  │ 5. Update local state with response │                │    │
│  │ 6. On error: loadCart() (rollback)  │                │    │
│  └────────────────────────────────────┼────────────────┘    │
│                                        │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USEAPI HOOK                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  • getCart(cartId)         → fetchCart()                        │
│  • updateCart(cartData)    → setCart()                          │
│  • submitOrder(orderData)  → createOrder()                      │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API.JS (HTTP)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  fetchCart(baseUrl, authToken, cartId)                          │
│    POST /b2b/v1/front/carts/get                                 │
│    Body: { id?: string }                                        │
│    Returns: ResponseCart                                        │
│         │                                                       │
│  setCart(baseUrl, authToken, cartData)                          │
│    POST /b2b/v1/front/carts/set                                 │
│    Headers: { X-Idempotency-Token }                             │
│    Body: {                                                      │
│      items: [{id, quantity}],                                   │
│      fulfillment_method: 'pickup',                              │
│      store_id: string,                                          │
│      id?: string,                                               │
│      version?: number                                           │
│    }                                                            │
│    Returns: ResponseCart                                        │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Endpoints:                                                     │
│  • POST /b2b/v1/front/carts/get                                 │
│  • POST /b2b/v1/front/carts/set                                 │
│  • POST /b2b/v1/front/orders/create                             │
│                                                                 │
│  Database:                                                      │
│  ┌─────────────────────────────────────┐                       │
│  │ Carts Table                         │                       │
│  │ • id (UUID)                         │                       │
│  │ • version (integer)                 │                       │
│  │ • items (JSON array)                │                       │
│  │ • total_price (decimal)             │                       │
│  │ • created_at, updated_at            │                       │
│  └─────────────────────────────────────┘                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Sequence Diagram: Adding Item to Cart

```
User          ProductCard       App.js         syncCart()      API          Server
 │                │               │                │            │              │
 │  Click "Add"  │               │                │            │              │
 │──────────────>│               │                │            │              │
 │               │ onAddToCart() │                │            │              │
 │               │──────────────>│                │            │              │
 │               │               │ 1. Optimistic  │            │              │
 │               │               │    UI Update   │            │              │
 │               │               │    (instant)   │            │              │
 │               │               │                │            │              │
 │               │               │  syncCart()    │            │              │
 │               │               │───────────────>│            │              │
 │               │               │                │ POST       │              │
 │               │               │                │ /carts/set │              │
 │               │               │                │───────────>│              │
 │               │               │                │            │ Validate     │
 │               │               │                │            │ Calculate    │
 │               │               │                │            │ Save to DB   │
 │               │               │                │            │──────────────>│
 │               │               │                │            │              │
 │               │               │                │            │<──────────────│
 │               │               │                │ 200 OK     │              │
 │               │               │                │ ResponseCart              │
 │               │               │                │<───────────│              │
 │               │               │<───────────────│            │              │
 │               │               │ 2. Update from │            │              │
 │               │               │    Server      │            │              │
 │               │               │    Response    │            │              │
 │               │               │                │            │              │
 │               │<──────────────│                │            │              │
 │               │  (UI already  │                │            │              │
 │               │   updated)    │                │            │              │
 │<──────────────│               │                │            │              │
 │  Scroll       │               │                │            │              │
 │  Position     │               │                │            │              │
 │  PRESERVED    │               │                │            │              │
```

## Key Features

### 1. Optimistic UI Updates
- UI updates **immediately** when user clicks
- Network request happens in background
- User doesn't wait for server response
- Scroll position preserved

### 2. Server as Source of Truth
- All cart data stored server-side
- Price calculations done by backend
- Cart persists across page refreshes
- Multi-device synchronization possible

### 3. Error Handling
```
┌─────────────────────────────────────────┐
│  User Action                            │
│  └─> Optimistic Update (instant)        │
│       └─> API Call                      │
│            ├─> Success: Update from     │
│            │   server response           │
│            │                             │
│            └─> Error: Rollback via      │
│                loadCart()                │
│                (fetch fresh from server)│
└─────────────────────────────────────────┘
```

### 4. Concurrency Control
- Uses `version` field for optimistic locking
- Prevents lost updates from concurrent requests
- Server rejects stale updates automatically

## Data Transformation

### Frontend → Backend (Request)
```javascript
// Frontend cart state
[
  { id: 'prod-1', title: 'Apple', price: 100, quantity: 2, image_url: '...' },
  { id: 'prod-2', title: 'Banana', price: 50, quantity: 1, image_url: '...' }
]

// Transformed to API request
{
  items: [
    { id: 'prod-1', quantity: 2 },
    { id: 'prod-2', quantity: 1 }
  ],
  fulfillment_method: 'pickup',
  store_id: 'store-123',
  id: 'cart-uuid',
  version: 5
}
```

### Backend → Frontend (Response)
```javascript
// API response (ResponseCart)
{
  id: 'cart-uuid',
  version: 6,
  items: [
    { 
      id: 'prod-1', 
      title: 'Apple', 
      price: '100.00', 
      full_price: '120.00',
      quantity: '2',
      image_url: '...'
    }
  ],
  total_price: '200.00',
  full_price: '240.00',
  delivery_fee: '0',
  service_fee: '0'
}

// Transformed to frontend state
[
  { 
    id: 'prod-1', 
    title: 'Apple',
    name: 'Apple',  // alias
    price: 100,     // parsed float
    quantity: 2,    // parsed float
    image_url: '...'
  }
]
```

## Benefits

✅ **UX**: Instant feedback, no loading spinners
✅ **Reliability**: Server validation, data persistence
✅ **Security**: Business logic on backend
✅ **Scalability**: Cart data centralized
✅ **Debugging**: Server logs all operations
✅ **Features**: Multi-device sync ready

## Testing Scenarios

1. **Normal Flow**: Add → Remove → Update → Checkout
2. **Network Issues**: Slow network, failures, timeouts
3. **Concurrent Updates**: Multiple tabs, rapid clicks
4. **Store Changes**: Switch stores, cart resets
5. **Page Refresh**: Cart data persists
6. **Scroll Position**: Verify preserved in all operations

