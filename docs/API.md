# API Documentation

> Full endpoint reference for Paper Prints backend API.

## Base URL
```
Development: http://localhost:3000/api
Production:  https://api.paperprints.in/api
```

## Authentication
All protected endpoints require: `Authorization: Bearer <token>`

---

## Auth
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/auth/register` | `{ name, email, phone, password, role }` | `{ token, user }` |
| POST | `/auth/login` | `{ phone, password }` | `{ token, user }` |
| POST | `/auth/refresh` | `{ refreshToken }` | `{ token }` |

## Files
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/files/upload` | `multipart/form-data (file)` | `{ fileId, pages, colorMap }` |
| GET | `/files/:id` | — | `{ file, pages }` |
| GET | `/files/:id/download` | — | `{ signedUrl }` |

## Vendors
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/vendors/nearby?lat=X&lng=Y&radius=5` | — | `{ vendors[] }` |
| GET | `/vendors/:id` | — | `{ vendor, settings, services }` |
| PATCH | `/vendors/:id/settings` | `{ priceBw, priceColor, ... }` | `{ settings }` |
| PATCH | `/vendors/:id/status` | `{ isActive }` | `{ vendor }` |

## Orders
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/orders` | `{ vendorId, fileId, pages[], copies, ... }` | `{ order }` |
| GET | `/orders` | — | `{ orders[] }` |
| GET | `/orders/:id` | — | `{ order, pages }` |
| PATCH | `/orders/:id/status` | `{ status, reason? }` | `{ order }` |
| GET | `/orders/:id/qr` | — | `{ qrCodeUrl }` |

## Payments
| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/payments/:orderId` | `{ method }` | `{ payment }` |
| GET | `/payments/:orderId` | — | `{ payment }` |
