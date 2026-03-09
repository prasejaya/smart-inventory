package repository

import (
	"smart-inventory/internal/models"

	"github.com/jmoiron/sqlx"
)

type StockOutRepository interface {
	FindAll(page, limit int) ([]models.StockOut, int, error)
	FindByID(id string) (*models.StockOut, error)
	FindDoneTransactions() ([]models.StockOut, error)
	Create(tx *sqlx.Tx, stockOut *models.StockOut) error
	UpdateStatus(tx *sqlx.Tx, id string, status models.StockOutStatus) error
	CreateLog(tx *sqlx.Tx, log *models.StockOutLog) error
	GetLogs(stockOutID string) ([]models.StockOutLog, error)
	BeginTx() (*sqlx.Tx, error)
}

type stockOutRepository struct {
	db *sqlx.DB
}

func NewStockOutRepository(db *sqlx.DB) StockOutRepository {
	return &stockOutRepository{db: db}
}

func (r *stockOutRepository) BeginTx() (*sqlx.Tx, error) {
	return r.db.Beginx()
}

func (r *stockOutRepository) FindAll(page, limit int) ([]models.StockOut, int, error) {
	var stockOuts []models.StockOut
	var total int

	err := r.db.Get(&total, `SELECT COUNT(*) FROM stock_outs`)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := `SELECT * FROM stock_outs ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	err = r.db.Select(&stockOuts, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return stockOuts, total, nil
}

func (r *stockOutRepository) FindByID(id string) (*models.StockOut, error) {
	var stockOut models.StockOut
	err := r.db.Get(&stockOut, `SELECT * FROM stock_outs WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	return &stockOut, nil
}

func (r *stockOutRepository) FindDoneTransactions() ([]models.StockOut, error) {
	var stockOuts []models.StockOut
	err := r.db.Select(&stockOuts, `SELECT * FROM stock_outs WHERE status='DONE' ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	return stockOuts, nil
}

func (r *stockOutRepository) Create(tx *sqlx.Tx, stockOut *models.StockOut) error {
	query := `INSERT INTO stock_outs (id, inventory_id, sku, name, customer, quantity, unit, status, notes, created_at, updated_at)
	          VALUES (:id, :inventory_id, :sku, :name, :customer, :quantity, :unit, :status, :notes, :created_at, :updated_at)`
	_, err := tx.NamedExec(query, stockOut)
	return err
}

func (r *stockOutRepository) UpdateStatus(tx *sqlx.Tx, id string, status models.StockOutStatus) error {
	query := `UPDATE stock_outs SET status=$1, updated_at=NOW() WHERE id=$2`
	_, err := tx.Exec(query, status, id)
	return err
}

func (r *stockOutRepository) CreateLog(tx *sqlx.Tx, log *models.StockOutLog) error {
	query := `INSERT INTO stock_out_logs (id, stock_out_id, old_status, new_status, changed_by, notes, created_at)
	          VALUES (:id, :stock_out_id, :old_status, :new_status, :changed_by, :notes, :created_at)`
	_, err := tx.NamedExec(query, log)
	return err
}

func (r *stockOutRepository) GetLogs(stockOutID string) ([]models.StockOutLog, error) {
	var logs []models.StockOutLog
	err := r.db.Select(&logs, `SELECT * FROM stock_out_logs WHERE stock_out_id=$1 ORDER BY created_at ASC`, stockOutID)
	if err != nil {
		return nil, err
	}
	return logs, nil
}