package routes

import (
	"smart-inventory/internal/controller"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	r *gin.Engine,
	inventoryCtrl *controller.InventoryController,
	stockInCtrl *controller.StockInController,
	stockOutCtrl *controller.StockOutController,
	reportCtrl *controller.ReportController,
) {
	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	api := r.Group("/api")

	// Inventory routes
	inventory := api.Group("/inventories")
	{
		inventory.GET("", inventoryCtrl.GetInventories)
		inventory.GET("/:id", inventoryCtrl.GetInventoryByID)
		inventory.POST("", inventoryCtrl.CreateInventory)
		inventory.PATCH("/:id/adjust", inventoryCtrl.AdjustStock)
	}

	// Stock In routes
	stockIn := api.Group("/stock-ins")
	{
		stockIn.GET("", stockInCtrl.GetStockIns)
		stockIn.GET("/:id", stockInCtrl.GetStockInByID)
		stockIn.POST("", stockInCtrl.CreateStockIn)
		stockIn.PATCH("/:id/status", stockInCtrl.UpdateStockInStatus)
	}

	// Stock Out routes
	stockOut := api.Group("/stock-outs")
	{
		stockOut.GET("", stockOutCtrl.GetStockOuts)
		stockOut.GET("/:id", stockOutCtrl.GetStockOutByID)
		stockOut.POST("", stockOutCtrl.CreateStockOut)
		stockOut.PATCH("/:id/status", stockOutCtrl.UpdateStockOutStatus)
	}

	// Report routes
	reports := api.Group("/reports")
	{
		reports.GET("/stock-in", reportCtrl.GetStockInReport)
		reports.GET("/stock-out", reportCtrl.GetStockOutReport)
	}
}