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

type StockInController struct {
	stockInRepo   repository.StockInRepository
	inventoryRepo repository.InventoryRepository
}

func NewStockInController(stockInRepo repository.StockInRepository, inventoryRepo repository.InventoryRepository) *StockInController {
	return &StockInController{
		stockInRepo:   stockInRepo,
		inventoryRepo: inventoryRepo,
	}
}

func (c *StockInController) GetStockIns(ctx *gin.Context) {
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
	if page < 1 { page = 1 }
	if limit < 1 { limit = 10 }

	stockIns, total, err := c.stockInRepo.FindAll(page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to fetch stock ins", Error: err.Error()})
		return
	}
	totalPages := (total + limit - 1) / limit
	ctx.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "Stock ins fetched successfully",
		Data: models.PaginatedResponse{Data: stockIns, Total: total, Page: page, Limit: limit, TotalPages: totalPages}})
}

func (c *StockInController) GetStockInByID(ctx *gin.Context) {
	id := ctx.Param("id")
	stockIn, err := c.stockInRepo.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "Stock in not found", Error: err.Error()})
		return
	}
	logs, _ := c.stockInRepo.GetLogs(id)
	ctx.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "Stock in fetched successfully",
		Data: gin.H{"stock_in": stockIn, "logs": logs}})
}

func (c *StockInController) CreateStockIn(ctx *gin.Context) {
	var req models.CreateStockInRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "Invalid request body", Error: err.Error()})
		return
	}

	inventory, err := c.inventoryRepo.FindBySKU(req.SKU)
	if err != nil {
		inventory = &models.Inventory{
			ID: uuid.New().String(), SKU: req.SKU, Name: req.Name, Customer: req.Customer,
			PhysicalStock: 0, AllocatedStock: 0, Unit: req.Unit,
			CreatedAt: time.Now(), UpdatedAt: time.Now(),
		}
		if err := c.inventoryRepo.Create(inventory); err != nil {
			ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create inventory record", Error: err.Error()})
			return
		}
	}

	tx, err := c.stockInRepo.BeginTx()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to begin transaction", Error: err.Error()})
		return
	}
	defer tx.Rollback()

	stockIn := &models.StockIn{
		ID: uuid.New().String(), InventoryID: inventory.ID, SKU: req.SKU, Name: req.Name,
		Customer: req.Customer, Quantity: req.Quantity, Unit: req.Unit,
		Status: models.StockInCreated, Notes: req.Notes,
		CreatedAt: time.Now(), UpdatedAt: time.Now(),
	}

	if err := c.stockInRepo.Create(tx, stockIn); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create stock in", Error: err.Error()})
		return
	}

	log := &models.StockInLog{
		ID: uuid.New().String(), StockInID: stockIn.ID, OldStatus: "",
		NewStatus: models.StockInCreated, ChangedBy: "system", Notes: "Stock in created", CreatedAt: time.Now(),
	}
	if err := c.stockInRepo.CreateLog(tx, log); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create log", Error: err.Error()})
		return
	}

	if err := tx.Commit(); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to commit transaction", Error: err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, models.APIResponse{Success: true, Message: "Stock in created successfully", Data: stockIn})
}

func (c *StockInController) UpdateStockInStatus(ctx *gin.Context) {
	id := ctx.Param("id")
	var req models.UpdateStockInStatusRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: "Invalid request body", Error: err.Error()})
		return
	}

	stockIn, err := c.stockInRepo.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{Success: false, Message: "Stock in not found"})
		return
	}

	if err := c.validateStockInTransition(stockIn.Status, req.Status); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{Success: false, Message: err.Error()})
		return
	}

	tx, err := c.stockInRepo.BeginTx()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to begin transaction", Error: err.Error()})
		return
	}
	defer tx.Rollback()

	if req.Status == models.StockInDone {
		if err := c.inventoryRepo.IncrementPhysicalStock(tx, stockIn.InventoryID, stockIn.Quantity); err != nil {
			ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to update inventory stock", Error: err.Error()})
			return
		}
	}

	if err := c.stockInRepo.UpdateStatus(tx, id, req.Status); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to update status", Error: err.Error()})
		return
	}

	log := &models.StockInLog{
		ID: uuid.New().String(), StockInID: id, OldStatus: stockIn.Status,
		NewStatus: req.Status, ChangedBy: "user", Notes: req.Notes, CreatedAt: time.Now(),
	}
	if err := c.stockInRepo.CreateLog(tx, log); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to create log", Error: err.Error()})
		return
	}

	if err := tx.Commit(); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{Success: false, Message: "Failed to commit transaction", Error: err.Error()})
		return
	}

	updatedStockIn, _ := c.stockInRepo.FindByID(id)
	ctx.JSON(http.StatusOK, models.APIResponse{Success: true, Message: "Stock in status updated successfully", Data: updatedStockIn})
}

func (c *StockInController) validateStockInTransition(current, next models.StockInStatus) error {
	validTransitions := map[models.StockInStatus][]models.StockInStatus{
		models.StockInCreated:    {models.StockInInProgress, models.StockInCancelled},
		models.StockInInProgress: {models.StockInDone, models.StockInCancelled},
		models.StockInDone:       {},
		models.StockInCancelled:  {},
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