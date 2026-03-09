package mocks

import (
	"smart-inventory/internal/models"

	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/mock"
)

// MockInventoryRepository
type MockInventoryRepository struct {
	mock.Mock
}

func (m *MockInventoryRepository) FindAll(filter models.InventoryFilter) ([]models.Inventory, int, error) {
	args := m.Called(filter)
	return args.Get(0).([]models.Inventory), args.Int(1), args.Error(2)
}

func (m *MockInventoryRepository) FindByID(id string) (*models.Inventory, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) FindBySKU(sku string) (*models.Inventory, error) {
	args := m.Called(sku)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Inventory), args.Error(1)
}

func (m *MockInventoryRepository) Create(inventory *models.Inventory) error {
	args := m.Called(inventory)
	return args.Error(0)
}

func (m *MockInventoryRepository) Update(inventory *models.Inventory) error {
	args := m.Called(inventory)
	return args.Error(0)
}

func (m *MockInventoryRepository) AdjustStock(id string, physicalStock int) error {
	args := m.Called(id, physicalStock)
	return args.Error(0)
}

func (m *MockInventoryRepository) IncrementPhysicalStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	args := m.Called(tx, inventoryID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) DecrementPhysicalStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	args := m.Called(tx, inventoryID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) AllocateStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	args := m.Called(tx, inventoryID, quantity)
	return args.Error(0)
}

func (m *MockInventoryRepository) ReleaseAllocatedStock(tx *sqlx.Tx, inventoryID string, quantity int) error {
	args := m.Called(tx, inventoryID, quantity)
	return args.Error(0)
}

// MockStockInRepository
type MockStockInRepository struct {
	mock.Mock
}

func (m *MockStockInRepository) FindAll(page, limit int) ([]models.StockIn, int, error) {
	args := m.Called(page, limit)
	return args.Get(0).([]models.StockIn), args.Int(1), args.Error(2)
}

func (m *MockStockInRepository) FindByID(id string) (*models.StockIn, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StockIn), args.Error(1)
}

func (m *MockStockInRepository) FindDoneTransactions() ([]models.StockIn, error) {
	args := m.Called()
	return args.Get(0).([]models.StockIn), args.Error(1)
}

func (m *MockStockInRepository) Create(tx *sqlx.Tx, stockIn *models.StockIn) error {
	args := m.Called(tx, stockIn)
	return args.Error(0)
}

func (m *MockStockInRepository) UpdateStatus(tx *sqlx.Tx, id string, status models.StockInStatus) error {
	args := m.Called(tx, id, status)
	return args.Error(0)
}

func (m *MockStockInRepository) CreateLog(tx *sqlx.Tx, log *models.StockInLog) error {
	args := m.Called(tx, log)
	return args.Error(0)
}

func (m *MockStockInRepository) GetLogs(stockInID string) ([]models.StockInLog, error) {
	args := m.Called(stockInID)
	return args.Get(0).([]models.StockInLog), args.Error(1)
}

func (m *MockStockInRepository) BeginTx() (*sqlx.Tx, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*sqlx.Tx), args.Error(1)
}

// MockStockOutRepository
type MockStockOutRepository struct {
	mock.Mock
}

func (m *MockStockOutRepository) FindAll(page, limit int) ([]models.StockOut, int, error) {
	args := m.Called(page, limit)
	return args.Get(0).([]models.StockOut), args.Int(1), args.Error(2)
}

func (m *MockStockOutRepository) FindByID(id string) (*models.StockOut, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StockOut), args.Error(1)
}

func (m *MockStockOutRepository) FindDoneTransactions() ([]models.StockOut, error) {
	args := m.Called()
	return args.Get(0).([]models.StockOut), args.Error(1)
}

func (m *MockStockOutRepository) Create(tx *sqlx.Tx, stockOut *models.StockOut) error {
	args := m.Called(tx, stockOut)
	return args.Error(0)
}

func (m *MockStockOutRepository) UpdateStatus(tx *sqlx.Tx, id string, status models.StockOutStatus) error {
	args := m.Called(tx, id, status)
	return args.Error(0)
}

func (m *MockStockOutRepository) CreateLog(tx *sqlx.Tx, log *models.StockOutLog) error {
	args := m.Called(tx, log)
	return args.Error(0)
}

func (m *MockStockOutRepository) GetLogs(stockOutID string) ([]models.StockOutLog, error) {
	args := m.Called(stockOutID)
	return args.Get(0).([]models.StockOutLog), args.Error(1)
}

func (m *MockStockOutRepository) BeginTx() (*sqlx.Tx, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*sqlx.Tx), args.Error(1)
}