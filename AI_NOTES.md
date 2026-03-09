# AI Usage Report

## AI Tools yang Digunakan
- Claude (Anthropic) — digunakan untuk scaffolding struktur project, boilerplate code, dan review arsitektur.

---

## 1 Prompt Paling Kompleks yang Digunakan

```
Buat sistem inventory management dengan Golang backend dan React frontend.
Backend harus menggunakan:
- Repository pattern dengan interface untuk semua DB access
- Controller untuk business logic
- Models hanya untuk SQL struct dan DTO
- PostgreSQL dengan sqlx
- Gin framework
- Unit test dengan testify/mock

Fitur yang dibutuhkan:
1. Stock In: state machine CREATED→IN_PROGRESS→DONE, dengan audit log di setiap transisi
2. Inventory: physical stock vs available stock (physical - allocated)
3. Stock Out: Two-Phase Commitment — Stage 1 allocate stock (increment allocated_stock),
   Stage 2 execute (decrement physical+allocated). Jika cancel: rollback allocated_stock.
4. Report: hanya tampilkan transaksi DONE.

Semua DB mutation yang kompleks (status update + inventory update) harus dalam satu
database transaction (BEGIN/COMMIT/ROLLBACK) untuk memastikan atomicity.
```

---

## Bagian Kode AI yang Dimodifikasi secara Manual

**Masalah:** AI awalnya membuat fungsi `UpdateStockInStatus` yang mengupdate status dan inventory
secara terpisah tanpa database transaction:

```go
// Versi AI (SALAH - tidak atomic):
func (c *StockInController) UpdateStockInStatus(...) {
    c.stockInRepo.UpdateStatus(id, req.Status)  // bisa sukses
    c.inventoryRepo.IncrementPhysicalStock(...)  // bisa gagal
    // Jika baris di atas gagal, status sudah terlanjur berubah tapi stock tidak bertambah!
}
```

**Perbaikan manual yang dilakukan:**

```go
// Versi yang diperbaiki (BENAR - menggunakan transaction):
func (c *StockInController) UpdateStockInStatus(...) {
    tx, err := c.stockInRepo.BeginTx()
    if err != nil { ... }
    defer tx.Rollback()  // Auto rollback jika terjadi error

    // Semua operasi dalam satu transaction
    if req.Status == models.StockInDone {
        c.inventoryRepo.IncrementPhysicalStock(tx, ...)  // pakai tx
    }
    c.stockInRepo.UpdateStatus(tx, id, req.Status)  // pakai tx
    c.stockInRepo.CreateLog(tx, log)                // pakai tx

    tx.Commit()  // Commit hanya jika SEMUA berhasil
}
```

**Alasan perbaikan:** Tanpa transaction, jika `IncrementPhysicalStock` gagal setelah `UpdateStatus` sudah
dipanggil, maka status Stock In berubah ke DONE tapi inventory tidak bertambah — menyebabkan data
inkonsisten. Dengan transaction, seluruh operasi bersifat atomic: either all succeed or all rollback.

Hal yang sama juga diterapkan pada `CreateStockOut` (alokasi stock + insert record harus atomic)
dan `UpdateStockOutStatus` (dekremen/rollback stock + update status harus atomic).
