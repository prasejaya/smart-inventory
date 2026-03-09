package main

import (
	"fmt"
	"log"
	"os"
	"smart-inventory/internal/controller"
	"smart-inventory/internal/repository"
	"smart-inventory/internal/routes"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func main() {
	// Database connection
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "smart_inventory")

	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	log.Println("Database connected successfully")

	// Initialize repositories
	inventoryRepo := repository.NewInventoryRepository(db)
	stockInRepo := repository.NewStockInRepository(db)
	stockOutRepo := repository.NewStockOutRepository(db)

	// Initialize controllers
	inventoryCtrl := controller.NewInventoryController(inventoryRepo)
	stockInCtrl := controller.NewStockInController(stockInRepo, inventoryRepo)
	stockOutCtrl := controller.NewStockOutController(stockOutRepo, inventoryRepo)
	reportCtrl := controller.NewReportController(stockInRepo, stockOutRepo)

	// Setup router
	r := gin.Default()
	routes.SetupRoutes(r, inventoryCtrl, stockInCtrl, stockOutCtrl, reportCtrl)

	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}