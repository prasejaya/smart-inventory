package repository

import (
	"smart-inventory/internal/models"

	"github.com/jmoiron/sqlx"
)

type StockInRepository interface {
	FindAll(page, limit int) ([]models.StockIn, int, error)
	FindByID(id string) (*models.StockIn, error)
	FindDoneTransactions() ([]models.StockIn, error)
	Create(tx *sqlx.Tx, stockIn *models.StockIn) error
	UpdateStatus(tx *sqlx.Tx, id string, status models.StockInStatus) error
	CreateLog(tx *sqlx.Tx, log *models.StockInLog) error
	GetLogs(stockInID string) ([]models.StockInLog, error)
	BeginTx() (*sqlx.Tx, error)
}

type stockInRepository struct {
	db *sqlx.DB
}

func NewStockInRepository(db *sqlx.DB) StockInRepository {
	return &stockInRepository{db: db}
}

func (r *stockInRepository) BeginTx() (*sqlx.Tx, error) {
	return r.db.Beginx()
}

func (r *stockInRepository) FindAll(page, limit int) ([]models.StockIn, int, error) {
	var stockIns []models.StockIn
	var total int

	err := r.db.Get(&total, `SELECT COUNT(*) FROM stock_ins`)
	if err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	query := `SELECT * FROM stock_ins ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	err = r.db.Select(&stockIns, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return stockIns, total, nil
}

func (r *stockInRepository) FindByID(id string) (*models.StockIn, error) {
	var stockIn models.StockIn
	err := r.db.Get(&stockIn, `SELECT * FROM stock_ins WHERE id=$1`, id)
	if err != nil {
		return nil, err
	}
	return &stockIn, nil
}

func (r *stockInRepository) FindDoneTransactions() ([]models.StockIn, error) {
	var stockIns []models.StockIn
	err := r.db.Select(&stockIns, `SELECT * FROM stock_ins WHERE status='DONE' ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	return stockIns, nil
}

func (r *stockInRepository) Create(tx *sqlx.Tx, stockIn *models.StockIn) error {
	query := `INSERT INTO stock_ins (id, inventory_id, sku, name, customer, quantity, unit, status, notes, created_at, updated_at)
	          VALUES (:id, :inventory_id, :sku, :name, :customer, :quantity, :unit, :status, :notes, :created_at, :updated_at)`
	_, err := tx.NamedExec(query, stockIn)
	return err
}

func (r *stockInRepository) UpdateStatus(tx *sqlx.Tx, id string, status models.StockInStatus) error {
	query := `UPDATE stock_ins SET status=$1, updated_at=NOW() WHERE id=$2`
	_, err := tx.Exec(query, status, id)
	return err
}

func (r *stockInRepository) CreateLog(tx *sqlx.Tx, log *models.StockInLog) error {
	query := `INSERT INTO stock_in_logs (id, stock_in_id, old_status, new_status, changed_by, notes, created_at)
	          VALUES (:id, :stock_in_id, :old_status, :new_status, :changed_by, :notes, :created_at)`
	_, err := tx.NamedExec(query, log)
	return err
}

func (r *stockInRepository) GetLogs(stockInID string) ([]models.StockInLog, error) {
	var logs []models.StockInLog
	err := r.db.Select(&logs, `SELECT * FROM stock_in_logs WHERE stock_in_id=$1 ORDER BY created_at ASC`, stockInID)
	if err != nil {
		return nil, err
	}
	return logs, nil
}