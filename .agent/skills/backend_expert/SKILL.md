---
name: Backend Expert
description: Expert knowledge and utilities for the Neverland Node.js/Express/MongoDB backend.
---

# Backend Expert Skill

This skill provides expertise in the specific backend architecture of the Neverland Web App.

## 1. Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, xss-clean, express-mongo-sanitize, express-rate-limit
- **Validation**: Joi or Zod (for strict input validation)
- **Monitoring**: Morgan (logging)

## 2. Project Structure (`/api`)

- **`app.js`**: Main entry point. Handles middleware, routes, and global error handling.
- **`config/`**: Configuration files (DB connection, CORS, security, etc.).
- **`controllers/`**: Logic for handling requests. Follows `module.exports.action = (req, res, next) => ...`.
- **`models/`**: Mongoose schemas.
- **`middlewares/`**: Custom middleware (e.g., `secure.mid.js` for auth).
- **`routes/`**: Route definitions (via `config/routes.config.js`).

## 3. Coding Standards & Patterns

### Error Handling

- **ALWAYS** use `next(error)` to pass errors to the global error handler.
- Use `http-errors` to create standard HTTP errors:
  ```javascript
  const createError = require('http-errors');
  // ...
  if (!resource) return next(createError(404, 'Resource not found'));
  ```
- Validation errors from Mongoose are automatically handled in `app.js` and converted to 400.

### Controllers

- Use standard Express middleware signature: `(req, res, next)`.
- Return JSON responses: `res.json(data)` or `res.status(201).json(data)`.
- Use Mongoose promises: `.then().catch(next)`.
- **Optimization**: ALWAYS ensure indexes are created for frequently queried fields (e.g., `date` in events).
- **Cleanup**: Controllers should be thin; move complex logic to Services if needed.

### Authentication

- Protected routes use `secure.auth` (or similar) middleware.
- `req.user` usually contains the authenticated user's data after middleware.

## 4. Domain Logic (Neverland)

### Reservations (`events` collection)

- **Shifts**: T1 (17:00-19:00), T2 (18:00-20:00), T3 (19:15-21:15).
- **States**: 'pendiente', 'confirmada', 'modificada', 'cancelada'.
- **Pricing**:
  - **Minimum**: 12 children.
  - **Menus**: 1-4 with different prices.
  - **Weekends/Holidays**: +1.50€/child.
  - **Adults**: Pay per item (e.g., "Tortilla", "Salaillas").
  - **Extras**: Workshops, Characters, Piñata, Extensions.

### Database Collections (Proposed/Active)

- `users`: Admin access.
- `reservations` (or `events`): Core booking data.
- `packs`, `menus`, `workshops`: Static or semi-static data.
- `settings`: Global configurations (prices, hours).

### Routes (`config/routes.config.js`)

- **Users**: `/users` (Create/Login/Restore).
- **Events**: `/events` (List/Create/Update/Delete). `secure.isAdmin` for sensitive actions.
- **Config**: `/config` (Get/Update prices).
- **Workshops**: `/workshops` (List/Create/Update/Delete).

## 5. Workflow for Changes

1.  **Model**: Update/Create Mongoose schema in `models/`.
2.  **Controller**: Implement logic in `controllers/`.
3.  **Route**: Add endpoint in `routes/` and register in `config/routes.config.js`.
4.  **Test**: verify with Postman or Frontend integration.

## 6. Common Tasks

- **New Endpoint**: Create controller function -> Create route in `routes.config.js`.
- **Validation**: Add Mongoose validation in Schema or manual checks in Controller.
- **Debug**: Check `app.js` error handler logs.
