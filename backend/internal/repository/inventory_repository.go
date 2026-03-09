package repository

import (
	"fmt"
	"smart-inventory/internal/models"

	"github.com/jmoiron/sqlx"
)

type InventoryRepository interface {
	FindAll(filter models.InventoryFilter) ([]models.Inventory, int, error)
	FindByID(id string) (*models.Inventory, error)
	FindBySKU(sku string) (*models.Inventory, error)
	Create(inventory *models.Inventory) error
	Update(inventory *models.Inventory) error
	AdjustStock(id string, physicalStock int) error
	IncrementPhysicalStock(tx *sqlx.Tx, inventoryID string, quantity int) error
	DecrementPhysicalStock(tx *sqlx.Tx, inventoryID string, quantity int) error
	AllocateStock(tx *sqlx.Tx, inventoryID string, quantity int) error
	ReleaseAllocatedStock(tx *sqlx.Tx, inventoryID string, quantity int) error
}

type inventoryRepository struct {
	db *sqlx.DB
}

func NewInventoryRepository(db *sqlx.DB) InventoryRepository {
	return &inventoryRepository{db: db}
}

func (r *inventoryRepository) FindAll(filter models.InventoryFilter) ([]models.Inventory, int, error) {
	var inventories []models.Inventory
	var total int

	query := `SELECT *, (physical_stock - allocated_stock) AS available_stock FROM inventories WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM inventories WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if filter.Name != "" {
		query += fmt.Sprintf(` AND name ILIKE $%d`, argIdx)
		countQuery += fmt.Sprintf(` AND name ILIKE $%d`, argIdx)
		args = append(args, "%"+filter.Name+"%")
		argIdx++
	}
	if filter.SKU != "" {
		query += fmt.Sprintf(` AND sku ILIKE $%d`, argIdx)
		countQuery += fmt.Sprintf(` AND sku ILIKE $%d`, argIdx)
		args = append(args, "%"+filter.SKU+"%")
		argIdx++
	}
	if filter.Customer != "" {
		query += fmt.Sprintf(` AND customer ILIKE $%d`, argIdx)
		countQuery += fmt.Sprintf(` AND customer ILIKE $%d`, argIdx)
		args = append(args, "%"+filter.Customer+"%")
		argIdx++
	}

	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	query += fmt.Sprintf(` ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, argIdx, argIdx+1)
	args = append(args, filter.Limit, offset)

	err = r.db.Select(&inventories, query, args...)
	if err != nil {
		return nil, 0, err
	}

	return inventories, total, nil
}

func (r *inventoryRepository) FindByID(id string) (*models.Inventory, error) {
	var inventory models.Inventory
	query := `SELECT *, (physical_stock - allocated_stock) AS available_stock FROM inventories WHERE id = $1`
	err := r.db.Get(&inventory, query, id)
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

func (r *inventoryRepository) FindBySKU(sku string) (*models.Inventory, error) {
	var inventory models.Inventory
	query := `SELECT *, (physical_stock - allocated_stock) AS available_stock FROM inventories WHERE sku = $1`
	err := r.db.Get(&inventory, query, sku)
	if err != nil {
		return nil, err
	}
	return &inventory, nil
}

func (r *inventoryRepository) Create(inventory *models.Inventory) error {
	query := `INSERT INTO inventories (id, sku, name, customer, physical_stock, allocated_stock, unit, created_at, updated_at)
	          VALUES (:id, :sku, :name, :customer, :physical_stock, :allocated_stock, :unit, :created_at, :updated_at)`
	_, err := r.db.NamedExec(query, inventory)
	return err
}

func (r *inventoryRepository) Update(inventory *models.Inventory) error {
	query := `UPDATE inventories SET name=:name, customer=:customer, unit=:unit, updated_at=:updated_at WHERE id=:id`
	_, err := r.db.NamedExec(query, inventory)
	return err
}

func (r *inventoryRepository) AdjustStock(id string, physicalStock int) error {
	query := `UPDATE inventories SET physical_stock=$1, updated_at=NOW() WHERE id=$2`
	_, err := r.db.Exec(query, physicalStock, id)
	return err
}

func (r *inventoryRepository) IncrementPhysicalStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	query := `UPDATE inventories SET physical_stock = physical_stock + $1, updated_at=NOW() WHERE id=$2`
	_, err := tx.Exec(query, quantity, inventoryID)
	return err
}

func (r *inventoryRepository) DecrementPhysicalStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	query := `UPDATE inventories SET physical_stock = physical_stock - $1, allocated_stock = allocated_stock - $1, updated_at=NOW() WHERE id=$2`
	_, err := tx.Exec(query, quantity, inventoryID)
	return err
}

func (r *inventoryRepository) AllocateStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	query := `UPDATE inventories SET allocated_stock = allocated_stock + $1, updated_at=NOW() WHERE id=$2`
	_, err := tx.Exec(query, quantity, inventoryID)
	return err
}

func (r *inventoryRepository) ReleaseAllocatedStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	query := `UPDATE inventories SET allocated_stock = allocated_stock - $1, updated_at=NOW() WHERE id=$2`
	_, err := tx.Exec(query, quantity, inventoryID)
	return err
}