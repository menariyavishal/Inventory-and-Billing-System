# Mobile Shop — Inventory, Billing & Sales Analytics System

## Project Status
✅ **Phase 1: Project Setup, Auth & Database** - **COMPLETED**
✅ **Phase 2: Inventory API & UI** - **COMPLETED**
⏳ Phase 3: Billing API & UI - *Pending*
⏳ Phase 4: Analytics Dashboard - *Pending*
⏳ Phase 5: Cloud Deployment - *Pending*

## Architecture
The project follows a unified full-stack architecture using Next.js 14 (App Router). 
- **Frontend:** React 18 / Next.js with Tailwind CSS
- **Backend:** Next.js API Routes / Server Actions
- **Database:** SQLite (Local Dev) / PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js (Credentials Provider)

## Features
### Implemented (Phases 1 & 2)
- Project skeleton and dependencies configured.
- Role-based authentication (Owner and Staff) using NextAuth.js and JWT.
- Middleware applied to protect routes based on RBAC.
- Login page and Dashboard layout skeleton.
- Database schema modeling (Users, Categories, Products, Bills, etc.).
- SQLite local database connected and seeded.
- Category Management (Create, Fetch).
- Product Management (Create, Fetch, Update, Delete).
- Role-Based Access controls for Products (Staff cannot see cost prices or add products/stock).
- Add Stock workflows:
  - Quantity-based increment for accessories.
  - Serialized IMEI-based unit creation for mobile devices (with duplicate IMEI prevention).

## APIs
### Endpoints implemented
- `POST /api/auth/[...nextauth]` - Handles credential login and JWT session generation.
- `GET /api/v1/categories` - Fetch active categories.
- `POST /api/v1/categories` - Create a new category (Owner only).
- `GET /api/v1/products` - Fetch products with filtering/search (Masks cost price for Staff).
- `POST /api/v1/products` - Create a new product (Owner only).
- `GET /api/v1/products/[id]` - Retrieve a single product (Masks cost price for Staff).
- `PUT /api/v1/products/[id]` - Update product details (Owner only).
- `DELETE /api/v1/products/[id]` - Soft delete a product (Owner only).
- `POST /api/v1/products/[id]/stock` - Add stock atomically via transaction (Owner only).

## Database
### Schema Updates
- Initiated Prisma schema with:
  - `User` (id, name, username, password_hash, role, is_active, created_at)
  - `Category` (id, name, parent_category_id, is_active)
  - `Product` (id, category_id, name, brand, product_type, cost_price, selling_price, quantity, thresholds)
  - `ProductUnit` (id, product_id, imei_number, status, cost_price, dates)
  - `StockInRecord` (audit trail)
  - `Customer` (name, phone)
  - `Bill` & `BillItem` (transactional records)

## Setup
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Ensure `.env` is configured with `DATABASE_URL="file:./dev.db"`.
4. Run `npx prisma migrate dev` to sync schema.
5. Run `npx tsx prisma/seed.ts` to seed initial users (`admin` / `password123` and `staff` / `password123`).
6. Run `npm run dev` and navigate to `http://localhost:3000`.

## Deployment
Deployment instructions will be updated in Phase 5. Target platform: Vercel + Supabase.

## Testing
- Build validation passed (`npm run build`).
- TypeScript checking passing.
- Test coverage will be added in Phase 3.

## Security
- Passwords hashed using `bcryptjs`.
- JWT-based session management.
- `middleware.ts` enforces `owner` role for sensitive routes (e.g. users, analytics, staff-management, product creations, stock modifications).
- Cost prices are filtered out from the database response at the API level if the logged-in user is counter staff.

## Changelog
- **v0.2.0** (Phase 2)
  - Implemented category and product endpoints with SQLite-compatible Prisma queries.
  - Implemented the Inventory page with search and category filters.
  - Form validation for adding products (Owner-only).
  - Form validation for adding stock with IMEI list processing.
  - Enforced cost price masking at the API layer for the Staff role.
- **v0.1.0** (Phase 1)
  - Initialized Next.js project with Tailwind CSS.
  - Configured Prisma with SQLite local database.
  - Implemented NextAuth credentials provider.
  - Added schema models and seed file.
  - Created protected dashboard layout and redirect mechanisms.
