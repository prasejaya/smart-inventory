# Smart Inventory Core System

Sistem manajemen stok berbasis web dengan backend **Golang** dan frontend **React + TypeScript**.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Golang 1.21, Gin Framework |
| Database | PostgreSQL |
| ORM/Query | sqlx |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| State Management | React Context + useReducer |
| Testing (BE) | testify, mock |
| Testing (FE) | Vitest, Testing Library |

---

## Fitur

### 1. Stock In (Barang Masuk)
- Alur status: `CREATED → IN_PROGRESS → DONE`
- Status `CANCELLED` hanya bisa dilakukan sebelum `DONE`
- Setiap perubahan status tercatat di tabel log/history
- Stok fisik hanya bertambah ketika status berubah menjadi `DONE`

### 2. Inventory (Cek Stok)
- Menampilkan daftar barang dengan filter (Nama, SKU, Customer)
- Memisahkan **Physical Stock** dan **Available Stock**
  - `Physical Stock` = total stok di gudang
  - `Available Stock` = Physical Stock - Allocated Stock
- Fitur Stock Adjustment (edit jumlah stok fisik)

### 3. Stock Out (Barang Keluar) — Two-Phase Commitment
- **Stage 1 — Allocation:**
  - Sistem cek ketersediaan stok
  - Jika stok cukup, buat reservasi (status `ALLOCATED`)
  - Stok yang dialokasikan tidak bisa diambil pesanan lain
- **Stage 2 — Execution:**
  - Ubah status ke `IN_PROGRESS` (proses packing/delivery)
  - Ubah status ke `DONE` → stok fisik berkurang
  - Jika di-cancel → sistem otomatis **rollback** stok ke available

### 4. Report
- Hanya menampilkan transaksi yang sudah `DONE`
- Report Stock In dan Stock Out terpisah
- Menampilkan detail transaksi lengkap

---

## Struktur Project

```
smart-inventory/
├── backend/
│   ├── cmd/
│   │   └── main.go                    # Entry point server
│   ├── internal/
│   │   ├── models/
│   │   │   └── models.go              # Struct SQL & DTO
│   │   ├── repository/
│   │   │   ├── inventory_repository.go
│   │   │   ├── stock_in_repository.go
│   │   │   └── stock_out_repository.go
│   │   ├── controller/
│   │   │   ├── inventory_controller.go
│   │   │   ├── stock_in_controller.go
│   │   │   ├── stock_out_controller.go
│   │   │   └── report_controller.go
│   │   └── routes/
│   │       └── routes.go
│   ├── migrations/
│   │   └── 001_init.sql               # Schema database
│   ├── tests/
│   │   ├── mocks/
│   │   │   └── mock_repositories.go
│   │   ├── inventory_test.go
│   │   ├── stock_in_test.go
│   │   └── stock_out_test.go
│   └── go.mod
└── frontend/
    └── src/
        ├── api/                        # Service layer (fetch wrapper)
        ├── context/                    # Global state management
        ├── components/
        │   ├── common/                 # StatusBadge, Pagination, Notification
        │   └── layout/                 # Layout & Navbar
        ├── pages/                      # InventoryPage, StockInPage, dll
        ├── types/                      # TypeScript interfaces
        └── test/                       # Unit tests
```

---

## Arsitektur

### Backend — Repository Pattern

```
Request → Routes → Controller → Repository → Database
                      ↑
               Business Logic
               (validasi, state machine,
                db transaction)
```

- **Models** — Hanya berisi struct SQL (db tags) dan DTO request/response
- **Repository** — Hanya bertanggung jawab query ke database. Menggunakan interface agar mudah di-mock saat unit test
- **Controller** — Semua business logic: validasi input, state machine transition, database transaction (BEGIN/COMMIT/ROLLBACK)
- **Routes** — Registrasi endpoint dan middleware CORS

### Frontend — Layered Architecture

```
User Interaction → Page → API Layer → Backend
                    ↑
              State (Context)
```

- **View/Components** — Hanya bertugas menampilkan data, tidak mengandung business logic
- **Pages** — Orchestrate data fetching, state updates, dan event handlers
- **API Layer** — Centralized fetch wrapper, semua endpoint terdefinisi di satu tempat
- **Context** — Global state dengan `useReducer` untuk predictable state transitions

### Prinsip yang Diterapkan

**SOLID:**
- **Single Responsibility** — Setiap layer punya tanggung jawab tunggal
- **Open/Closed** — Status transition map mudah di-extend tanpa ubah logic utama
- **Dependency Inversion** — Controller bergantung pada interface Repository, bukan implementasi

**DRY:**
- Status transition logic terpusat di `validateXxxTransition()`
- API response format konsisten via `APIResponse` struct
- Reusable components: StatusBadge, Pagination, Notification

---

## Database Schema

```sql
inventories
├── id (PK)
├── sku (UNIQUE)
├── name
├── customer
├── physical_stock
├── allocated_stock
├── available_stock (GENERATED: physical - allocated)
└── unit

stock_ins
├── id (PK)
├── inventory_id (FK → inventories)
├── quantity
├── status: CREATED | IN_PROGRESS | DONE | CANCELLED
└── ...

stock_in_logs        -- Audit trail setiap perubahan status
├── stock_in_id (FK)
├── old_status
├── new_status
└── ...

stock_outs
├── id (PK)
├── inventory_id (FK → inventories)
├── quantity
├── status: DRAFT | ALLOCATED | IN_PROGRESS | DONE | CANCELLED
└── ...

stock_out_logs       -- Audit trail setiap perubahan status
├── stock_out_id (FK)
├── old_status
├── new_status
└── ...
```

---

## Cara Menjalankan

### Prasyarat
- Go 1.21+
- Node.js 20+
- PostgreSQL 15+

### 1. Setup Database

```bash
# Buat database
psql -U postgres -c "CREATE DATABASE stock;"

# Jalankan migration
psql -U postgres -d stock -f backend/migrations/001_init.sql
```

### 2. Jalankan Backend

```cmd
cd backend
go mod tidy

:: Windows Command Prompt
set DB_HOST=localhost
set DB_PORT=5432
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_NAME=stock
go run cmd/main.go
```

Server berjalan di **http://localhost:8080**

### 3. Jalankan Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Buka browser ke **http://localhost:5173**

---

## API Endpoints

### Inventory
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/inventories | List inventory (filter: name, sku, customer) |
| GET | /api/inventories/:id | Detail inventory |
| POST | /api/inventories | Buat item baru |
| PATCH | /api/inventories/:id/adjust | Adjust physical stock |

### Stock In
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/stock-ins | List stock in |
| GET | /api/stock-ins/:id | Detail + log |
| POST | /api/stock-ins | Buat stock in baru |
| PATCH | /api/stock-ins/:id/status | Update status |

### Stock Out
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/stock-outs | List stock out |
| GET | /api/stock-outs/:id | Detail + log |
| POST | /api/stock-outs | Buat stock out (Stage 1 Allocation) |
| PATCH | /api/stock-outs/:id/status | Update status (Stage 2 / Cancel) |

### Report
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | /api/reports/stock-in | Report stock in (DONE only) |
| GET | /api/reports/stock-out | Report stock out (DONE only) |

---

## Menjalankan Unit Test

### Backend
```bash
cd backend
go test ./tests/... -v
```

### Frontend
```bash
cd frontend
npm test

# Dengan coverage
npm run test:coverage
```

---

## Two-Phase Commitment Flow

```
POST /api/stock-outs
│
├── Cek available stock (physical - allocated)
├── allocated_stock += quantity   ← stok direservasi
└── Status: ALLOCATED

PATCH status → IN_PROGRESS
└── Status: IN_PROGRESS (proses packing)

PATCH status → DONE
├── physical_stock -= quantity
├── allocated_stock -= quantity
└── Status: DONE ✓

PATCH status → CANCELLED (dari stage manapun)
├── allocated_stock -= quantity   ← rollback
└── Status: CANCELLED
```
