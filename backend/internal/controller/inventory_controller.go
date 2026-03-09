package controller

import (
	"net/http"
	"smart-inventory/internal/models"
	"smart-inventory/internal/repository"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type InventoryController struct {
	inventoryRepo repository.InventoryRepository
}

func NewInventoryController(inventoryRepo repository.InventoryRepository) *InventoryController {
	return &InventoryController{inventoryRepo: inventoryRepo}
}

// GetInventories handles GET /api/inventories
func (c *InventoryController) GetInventories(ctx *gin.Context) {
	var filter models.InventoryFilter
	if err := ctx.ShouldBindQuery(&filter); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid query parameters",
			Error:   err.Error(),
		})
		return
	}

	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	}

	inventories, total, err := c.inventoryRepo.FindAll(filter)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch inventories",
			Error:   err.Error(),
		})
		return
	}

	totalPages := (total + filter.Limit - 1) / filter.Limit

	ctx.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Inventories fetched successfully",
		Data: models.PaginatedResponse{
			Data:       inventories,
			Total:      total,
			Page:       filter.Page,
			Limit:      filter.Limit,
			TotalPages: totalPages,
		},
	})
}

// GetInventoryByID handles GET /api/inventories/:id
func (c *InventoryController) GetInventoryByID(ctx *gin.Context) {
	id := ctx.Param("id")

	inventory, err := c.inventoryRepo.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Inventory not found",
			Error:   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Inventory fetched successfully",
		Data:    inventory,
	})
}

// CreateInventory handles POST /api/inventories
func (c *InventoryController) CreateInventory(ctx *gin.Context) {
	var req struct {
		SKU      string `json:"sku" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Customer string `json:"customer" binding:"required"`
		Unit     string `json:"unit" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	// Check if SKU already exists
	existing, _ := c.inventoryRepo.FindBySKU(req.SKU)
	if existing != nil {
		ctx.JSON(http.StatusConflict, models.APIResponse{
			Success: false,
			Message: "SKU already exists",
		})
		return
	}

	inventory := &models.Inventory{
		ID:             uuid.New().String(),
		SKU:            req.SKU,
		Name:           req.Name,
		Customer:       req.Customer,
		PhysicalStock:  0,
		AllocatedStock: 0,
		AvailableStock: 0,
		Unit:           req.Unit,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := c.inventoryRepo.Create(inventory); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to create inventory",
			Error:   err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Message: "Inventory created successfully",
		Data:    inventory,
	})
}

// AdjustStock handles PATCH /api/inventories/:id/adjust
func (c *InventoryController) AdjustStock(ctx *gin.Context) {
	id := ctx.Param("id")

	var req models.StockAdjustmentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
		return
	}

	inventory, err := c.inventoryRepo.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Message: "Inventory not found",
		})
		return
	}

	// Physical stock cannot be less than allocated stock
	if req.PhysicalStock < inventory.AllocatedStock {
		ctx.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Message: "Physical stock cannot be less than allocated stock (" + strconv.Itoa(inventory.AllocatedStock) + ")",
		})
		return
	}

	if err := c.inventoryRepo.AdjustStock(id, req.PhysicalStock); err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to adjust stock",
			Error:   err.Error(),
		})
		return
	}

	updatedInventory, _ := c.inventoryRepo.FindByID(id)
	ctx.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Stock adjusted successfully",
		Data:    updatedInventory,
	})
}