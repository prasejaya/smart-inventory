package models

import "time"

// Status constants for Stock In
type StockInStatus string

const (
	StockInCreated    StockInStatus = "CREATED"
	StockInInProgress StockInStatus = "IN_PROGRESS"
	StockInDone       StockInStatus = "DONE"
	StockInCancelled  StockInStatus = "CANCELLED"
)

// Status constants for Stock Out
type StockOutStatus string

const (
	StockOutDraft      StockOutStatus = "DRAFT"
	StockOutAllocated  StockOutStatus = "ALLOCATED"
	StockOutInProgress StockOutStatus = "IN_PROGRESS"
	StockOutDone       StockOutStatus = "DONE"
	StockOutCancelled  StockOutStatus = "CANCELLED"
)

// Inventory represents physical stock in warehouse
type Inventory struct {
	ID             string    `db:"id" json:"id"`
	SKU            string    `db:"sku" json:"sku"`
	Name           string    `db:"name" json:"name"`
	Customer       string    `db:"customer" json:"customer"`
	PhysicalStock  int       `db:"physical_stock" json:"physical_stock"`
	AllocatedStock int       `db:"allocated_stock" json:"allocated_stock"`
	AvailableStock int       `db:"available_stock" json:"available_stock"`
	Unit           string    `db:"unit" json:"unit"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`
	UpdatedAt      time.Time `db:"updated_at" json:"updated_at"`
}

// StockIn represents incoming stock transaction
type StockIn struct {
	ID          string        `db:"id" json:"id"`
	InventoryID string        `db:"inventory_id" json:"inventory_id"`
	SKU         string        `db:"sku" json:"sku"`
	Name        string        `db:"name" json:"name"`
	Customer    string        `db:"customer" json:"customer"`
	Quantity    int           `db:"quantity" json:"quantity"`
	Unit        string        `db:"unit" json:"unit"`
	Status      StockInStatus `db:"status" json:"status"`
	Notes       string        `db:"notes" json:"notes"`
	CreatedAt   time.Time     `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `db:"updated_at" json:"updated_at"`
}

// StockInLog represents audit log for stock in transactions
type StockInLog struct {
	ID          string        `db:"id" json:"id"`
	StockInID   string        `db:"stock_in_id" json:"stock_in_id"`
	OldStatus   StockInStatus `db:"old_status" json:"old_status"`
	NewStatus   StockInStatus `db:"new_status" json:"new_status"`
	ChangedBy   string        `db:"changed_by" json:"changed_by"`
	Notes       string        `db:"notes" json:"notes"`
	CreatedAt   time.Time     `db:"created_at" json:"created_at"`
}

// StockOut represents outgoing stock transaction
type StockOut struct {
	ID          string         `db:"id" json:"id"`
	InventoryID string         `db:"inventory_id" json:"inventory_id"`
	SKU         string         `db:"sku" json:"sku"`
	Name        string         `db:"name" json:"name"`
	Customer    string         `db:"customer" json:"customer"`
	Quantity    int            `db:"quantity" json:"quantity"`
	Unit        string         `db:"unit" json:"unit"`
	Status      StockOutStatus `db:"status" json:"status"`
	Notes       string         `db:"notes" json:"notes"`
	CreatedAt   time.Time      `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time      `db:"updated_at" json:"updated_at"`
}

// StockOutLog represents audit log for stock out transactions
type StockOutLog struct {
	ID          string         `db:"id" json:"id"`
	StockOutID  string         `db:"stock_out_id" json:"stock_out_id"`
	OldStatus   StockOutStatus `db:"old_status" json:"old_status"`
	NewStatus   StockOutStatus `db:"new_status" json:"new_status"`
	ChangedBy   string         `db:"changed_by" json:"changed_by"`
	Notes       string         `db:"notes" json:"notes"`
	CreatedAt   time.Time      `db:"created_at" json:"created_at"`
}

// DTO - Data Transfer Objects
type CreateStockInRequest struct {
	SKU      string `json:"sku" binding:"required"`
	Name     string `json:"name" binding:"required"`
	Customer string `json:"customer" binding:"required"`
	Quantity int    `json:"quantity" binding:"required,min=1"`
	Unit     string `json:"unit" binding:"required"`
	Notes    string `json:"notes"`
}

type UpdateStockInStatusRequest struct {
	Status StockInStatus `json:"status" binding:"required"`
	Notes  string        `json:"notes"`
}

type CreateStockOutRequest struct {
	InventoryID string `json:"inventory_id" binding:"required"`
	Quantity    int    `json:"quantity" binding:"required,min=1"`
	Notes       string `json:"notes"`
}

type UpdateStockOutStatusRequest struct {
	Status StockOutStatus `json:"status" binding:"required"`
	Notes  string         `json:"notes"`
}

type StockAdjustmentRequest struct {
	PhysicalStock int    `json:"physical_stock" binding:"required,min=0"`
	Notes         string `json:"notes"`
}

type InventoryFilter struct {
	Name     string `form:"name"`
	SKU      string `form:"sku"`
	Customer string `form:"customer"`
	Page     int    `form:"page,default=1"`
	Limit    int    `form:"limit,default=10"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int         `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}