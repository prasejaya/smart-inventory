package controller

import (
	"net/http"
	"smart-inventory/internal/models"
	"smart-inventory/internal/repository"

	"github.com/gin-gonic/gin"
)

type ReportController struct {
	stockInRepo  repository.StockInRepository
	stockOutRepo repository.StockOutRepository
}

func NewReportController(stockInRepo repository.StockInRepository, stockOutRepo repository.StockOutRepository) *ReportController {
	return &ReportController{
		stockInRepo:  stockInRepo,
		stockOutRepo: stockOutRepo,
	}
}

// GetStockInReport handles GET /api/reports/stock-in
func (c *ReportController) GetStockInReport(ctx *gin.Context) {
	stockIns, err := c.stockInRepo.FindDoneTransactions()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch stock in report",
			Error:   err.Error(),
		})
		return
	}

	// Enrich with logs
	type StockInWithLogs struct {
		models.StockIn
		Logs []models.StockInLog `json:"logs"`
	}

	result := make([]StockInWithLogs, 0, len(stockIns))
	for _, si := range stockIns {
		logs, _ := c.stockInRepo.GetLogs(si.ID)
		result = append(result, StockInWithLogs{StockIn: si, Logs: logs})
	}

	ctx.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Stock in report fetched successfully",
		Data:    result,
	})
}

// GetStockOutReport handles GET /api/reports/stock-out
func (c *ReportController) GetStockOutReport(ctx *gin.Context) {
	stockOuts, err := c.stockOutRepo.FindDoneTransactions()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Message: "Failed to fetch stock out report",
			Error:   err.Error(),
		})
		return
	}

	type StockOutWithLogs struct {
		models.StockOut
		Logs []models.StockOutLog `json:"logs"`
	}

	result := make([]StockOutWithLogs, 0, len(stockOuts))
	for _, so := range stockOuts {
		logs, _ := c.stockOutRepo.GetLogs(so.ID)
		result = append(result, StockOutWithLogs{StockOut: so, Logs: logs})
	}

	ctx.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Stock out report fetched successfully",
		Data:    result,
	})
}