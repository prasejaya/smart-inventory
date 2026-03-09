package controller

import (
	"fmt"
	"net/http"
	"smart-inventory/internal/models"
	"smart-inventory/internal/repository"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type StockOutController struct {
	stockOutRepo  repository.StockOutRepository
	inventoryRepo repository.InventoryRepository
}

func NewStockOutController(stockOutRepo repository.StockOutRepository, inventoryRepo repository.InventoryRepository) *StockOutController {
	return &StockOutController{
		stockOutRepo:  stockOutRepo,
		inventoryRepo: inventoryRepo,
	}
}

func (c *StockOutController) GetStockOuts(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 { limit = 10 }

	stockOuts, total, err := c.stockOutRepo.FindAll(page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to fetch stock outs", Error: err.Error()})
		return
	}
	totalPages := (total + limit - 1) / limit
	ctx.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "Stock outs fetched successfully",
		Data: models.PaginatedResponse{Data: stockOuts, Total: total, Page: page, Limit: limit, TotalPages: totalPages}})
}

func (c *StockOutController) GetStockOutByID(ctx *gin.Context) {
	id := ctx.Param("id")
	stockOut, err := c.stockOutRepo.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "Stock out not found", Error: err.Error()})
		return
	}
	logs, _ := c.stockOutRepo.GetLogs(id)
	ctx.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "Stock out fetched successfully",
		Data: gin.H{"stock_out": stockOut, "logs": logs}})
}

// CreateStockOut handles Stage 1: Allocation/Draft (Two-Phase Commitment)
func (c *StockOutController) CreateStockOut(ctx *gin.Context) {
	var req models.CreateStockOutRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "Invalid request body", Error: err.Error()})
		return
	}

	// Get inventory and check available stock
	inventory, err := c.inventoryRepo.FindByID(req.InventoryID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "Inventory not found"})
		return
	}

	availableStock := inventory.PhysicalStock - inventory.AllocatedStock
	if availableStock < req.Quantity {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: fmt.Sprintf("Insufficient stock. Available: %d, Requested: %d", availableStock, req.Quantity),
		})
		return
	}

	// Begin transaction
	tx, err := c.stockOutRepo.BeginTx()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to begin transaction", Error: err.Error()})
		return
	}
	defer tx.Rollback()

	// Reserve/allocate stock immediately (Two-Phase: Stage 1)
	if err := c.inventoryRepo.AllocateStock(tx, inventory.ID, req.Quantity); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to allocate stock", Error: err.Error()})
		return
	}

	stockOut := &models.StockOut{
		ID: uuid.New().String(), InventoryID: inventory.ID, SKU: inventory.SKU,
		Name: inventory.Name, Customer: inventory.Customer, Quantity: req.Quantity,
		Unit: inventory.Unit, Status: models.StockOutAllocated,
		Notes: req.Notes, CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}

	if err := c.stockOutRepo.Create(tx, stockOut); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create stock out", Error: err.Error()})
		return
	}

	log := &models.StockOutLog{
		ID: uuid.New().String(), StockOutID: stockOut.ID, OldStatus: "",
		NewStatus: models.StockOutAllocated, ChangedBy: "system",
		Notes: "Stock out allocated (Stage 1)", CreatedAt: time.Now(),
	}
	if err := c.stockOutRepo.CreateLog(tx, log); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create log", Error: err.Error()})
		return
	}

	if err := tx.Commit(); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to commit transaction", Error: err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, models.APIResponse{Success: true, Message: "Stock out allocated successfully (Stage 1 complete)", Data: stockOut})
}

// UpdateStockOutStatus handles Stage 2: Execution and cancellation with rollback
func (c *StockOutController) UpdateStockOutStatus(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.UpdateStockOutStatusRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "Invalid request body", Error: err.Error()})
		return
	}

	stockOut, err := c.stockOutRepo.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "Stock out not found"})
		return
	}

	if err := c.validateStockOutTransition(stockOut.Status, req.Status); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: err.Error()})
		return
	}

	tx, err := c.stockOutRepo.BeginTx()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to begin transaction", Error: err.Error()})
		return
	}
	defer tx.Rollback()

	// Stage 2: Execute - deduct physical stock when DONE
	if req.Status == models.StockOutDone {
		if err := c.inventoryRepo.DecrementPhysicalStock(tx, stockOut.InventoryID, stockOut.Quantity); err != nil {
			ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to decrement stock", Error: err.Error()})
			return
		}
	}

	// Rollback: release allocated stock on cancel
	if req.Status == models.StockOutCancelled {
		if err := c.inventoryRepo.ReleaseAllocatedStock(tx, stockOut.InventoryID, stockOut.Quantity); err != nil {
			ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to release allocated stock", Error: err.Error()})
			return
		}
	}

	if err := c.stockOutRepo.UpdateStatus(tx, id, req.Status); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to update status", Error: err.Error()})
		return
	}

	log := &models.StockOutLog{
		ID: uuid.New().String(), StockOutID: id, OldStatus: stockOut.Status,
		NewStatus: req.Status, ChangedBy: "user", Notes: req.Notes, CreatedAt: time.Now(),
	}
	if err := c.stockOutRepo.CreateLog(tx, log); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create log", Error: err.Error()})
		return
	}

	if err := tx.Commit(); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to commit transaction", Error: err.Error()})
		return
	}

	updatedStockOut, _ := c.stockOutRepo.FindByID(id)
	ctx.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "Stock out status updated successfully", Data: updatedStockOut})
}

func (c *StockOutController) validateStockOutTransition(current, next models.StockOutStatus) error {
	validTransitions := map[models.StockOutStatus][]models.StockOutStatus{
		models.StockOutDraft:      {models.StockOutAllocated, models.StockOutCancelled},
		models.StockOutAllocated:  {models.StockOutInProgress, models.StockOutCancelled},
		models.StockOutInProgress: {models.StockOutDone, models.StockOutCancelled},
		models.StockOutDone:       {},
		models.StockOutCancelled:  {},
	}
	allowed, ok := validTransitions[current]
	if !ok {
		return fmt.Errorf("invalid current status: %s", current)
	}
	for _, s := range allowed {
		if s == next {
			return nil
		}
	}
	return fmt.Errorf("cannot transition from %s to %s", current, next)
}