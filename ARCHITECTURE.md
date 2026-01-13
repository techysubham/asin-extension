# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │  popup.html  │────────▶│  popup.js    │                  │
│  │  (UI Layer)  │         │  (Logic)     │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                           │
│                                   │ Uses                      │
│                                   ▼                           │
│                          ┌────────────────┐                  │
│                          │ db-service.js  │                  │
│                          │  (Abstraction) │                  │
│                          └────────┬───────┘                  │
│                                   │                           │
│                    ┌──────────────┴──────────────┐           │
│                    │                              │           │
│                    ▼                              ▼           │
│           ┌─────────────────┐          ┌─────────────────┐  │
│           │  firebase-db.js │          │  nodejs-db.js   │  │
│           │  (Firebase)     │          │  (Your Backend) │  │
│           └────────┬────────┘          └────────┬────────┘  │
│                    │                             │           │
└────────────────────┼─────────────────────────────┼───────────┘
                     │                             │
                     │                             │
    ┌────────────────▼──────────┐  ┌──────────────▼──────────┐
    │   Firebase Cloud          │  │   Your Node.js Server   │
    │   - Realtime Database     │  │   - Express.js          │
    │   - Free Tier Available   │  │   - Your Database       │
    │   - 5min Setup            │  │   - Full Control        │
    └───────────────────────────┘  └─────────────────────────┘
```

## Data Flow

### Saving ASINs Flow

```
User Action (Click "Save ASINs")
    │
    ▼
popup.js validates input
    │
    ▼
Calls: dbService.saveAsins(account, category, asins)
    │
    ▼
db-service.js routes to implementation
    │
    ├─────────────────┬──────────────────┐
    ▼                 ▼                  ▼
Firebase           Node.js         Chrome.storage
(if configured)   (if configured)   (fallback)
    │                 │                  │
    ▼                 ▼                  ▼
Cloud Storage     Your Database    Local Browser
    │                 │                  │
    └─────────────────┴──────────────────┘
                      │
                      ▼
            Success/Error Response
                      │
                      ▼
              Update UI & Show Status
```

### Loading ASINs Flow

```
User Action (Click "View Saved ASINs")
    │
    ▼
popup.js requests data
    │
    ▼
Calls: dbService.getAllAsins(accountFilter)
    │
    ▼
db-service.js routes to implementation
    │
    ├─────────────────┬──────────────────┐
    ▼                 ▼                  ▼
Firebase           Node.js         Chrome.storage
fetches data      fetches data    fetches data
    │                 │                  │
    └─────────────────┴──────────────────┘
                      │
                      ▼
        Transform to standard format
        { account: { category: [asins] } }
                      │
                      ▼
              Render in popup.html
```

## Component Responsibilities

### 1. popup.html + popup.css
```
┌──────────────────────────────────┐
│  User Interface                  │
├──────────────────────────────────┤
│  • Filter controls               │
│  • Account/Category dropdowns    │
│  • Save/Export buttons           │
│  • Results display               │
│  • Status messages               │
└──────────────────────────────────┘
```

### 2. popup.js
```
┌──────────────────────────────────┐
│  Business Logic                  │
├──────────────────────────────────┤
│  • Handle user interactions      │
│  • Validate inputs               │
│  • Call database service         │
│  • Update UI                     │
│  • Error handling                │
└──────────────────────────────────┘
```

### 3. db-service.js
```
┌──────────────────────────────────┐
│  Abstraction Layer               │
├──────────────────────────────────┤
│  • Universal database interface  │
│  • Route to correct backend      │
│  • Method signatures:            │
│    - saveAsins()                 │
│    - getAllAsins()               │
│    - getAccounts()               │
│    - addCategory()               │
│    - etc.                        │
└──────────────────────────────────┘
```

### 4. firebase-db.js
```
┌──────────────────────────────────┐
│  Firebase Implementation         │
├──────────────────────────────────┤
│  • Initialize Firebase SDK       │
│  • Implement interface methods   │
│  • Handle Firebase queries       │
│  • Manage real-time sync         │
│  • Error handling                │
└──────────────────────────────────┘
```

### 5. nodejs-db.js
```
┌──────────────────────────────────┐
│  Node.js Implementation          │
├──────────────────────────────────┤
│  • Make HTTP requests            │
│  • Implement interface methods   │
│  • Handle API responses          │
│  • Authentication                │
│  • Error handling                │
└──────────────────────────────────┘
```

### 6. db-config.js
```
┌──────────────────────────────────┐
│  Configuration                   │
├──────────────────────────────────┤
│  • Select backend (type)         │
│  • Firebase credentials          │
│  • Node.js API URL               │
│  • API keys                      │
│  • Endpoint mappings             │
└──────────────────────────────────┘
```

## Backend Switching

### Current Setup (Firebase)
```
db-config.js
├── type: 'firebase' ◄─── Currently Active
├── firebase: { ... }
└── nodejs: { ... }
```

### After Migration (Node.js)
```
db-config.js
├── type: 'nodejs' ◄─── Simply change this!
├── firebase: { ... }
└── nodejs: { ... }
```

## Database Schema

### Firebase Structure
```
firebase-project/
└── realtime-database/
    ├── asins/
    │   ├── Account1/
    │   │   ├── category1: ["ASIN1", "ASIN2", ...]
    │   │   └── category2: ["ASIN3", "ASIN4", ...]
    │   └── Account2/
    │       └── category1: ["ASIN5", "ASIN6", ...]
    ├── accounts/
    │   └── ["Account1", "Account2", ...]
    ├── categories/
    │   └── ["category1", "category2", ...]
    └── meta/
        └── Account1/
            └── category1/
                ├── lastUpdated: timestamp
                └── count: 150
```

### SQL Structure (for Node.js)
```sql
-- Table: asins
CREATE TABLE asins (
  id INT PRIMARY KEY,
  account VARCHAR(255),
  category VARCHAR(255),
  asin VARCHAR(50),
  created_at TIMESTAMP,
  INDEX(account, category)
);

-- Table: accounts
CREATE TABLE accounts (
  id INT PRIMARY KEY,
  name VARCHAR(255) UNIQUE
);

-- Table: categories
CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(255) UNIQUE
);
```

## Error Handling Flow

```
User Action
    │
    ▼
Try: Database Operation
    │
    ├─── Success ────▶ Update UI ───▶ Show success message
    │
    └─── Error ──────▶ Log error
                      │
                      ▼
                Try: Fallback (chrome.storage)
                      │
                      ├─── Success ──▶ Update UI
                      │
                      └─── Error ────▶ Show error message
```

## Security Layers

```
┌────────────────────────────────────────┐
│  Extension (Client-Side)               │
│  • Input validation                    │
│  • HTTPS only                          │
│  • API key encryption                  │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Firebase / Node.js (Backend)          │
│  • Authentication                      │
│  • Authorization rules                 │
│  • Rate limiting                       │
│  • Data validation                     │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Database                              │
│  • Encrypted storage                   │
│  • Backup & recovery                   │
│  • Access logs                         │
└────────────────────────────────────────┘
```

## Performance Optimization

```
Request Flow with Caching:

User Request
    │
    ▼
Check: Local Cache
    │
    ├─── Hit ─────▶ Return cached data (Fast!)
    │
    └─── Miss ────▶ Fetch from database
                    │
                    ▼
                 Update cache
                    │
                    ▼
                 Return data
```

## Scalability Path

```
Phase 1: Development
├── Firebase test mode
├── No authentication
└── Local testing

Phase 2: Production
├── Firebase with auth
├── Security rules
└── Multiple users

Phase 3: Scale Up
├── Migrate to Node.js
├── Own database
├── Advanced features
└── Team collaboration

Phase 4: Enterprise
├── Microservices
├── Load balancing
├── Analytics
└── API for partners
```

---

## Key Design Principles

1. **Separation of Concerns**
   - UI ≠ Logic ≠ Data
   - Each layer has one responsibility

2. **Abstraction**
   - Database implementation hidden from UI
   - Easy to swap backends

3. **Fallback Strategy**
   - Always have a backup plan
   - Never lose functionality

4. **Progressive Enhancement**
   - Start simple (Firebase)
   - Scale when needed (Node.js)

5. **Error Resilience**
   - Graceful error handling
   - User-friendly messages

---

This architecture ensures your extension is:
- ✅ Easy to set up
- ✅ Simple to maintain
- ✅ Ready to scale
- ✅ Flexible for changes
