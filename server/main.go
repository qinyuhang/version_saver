package main

import (
	"log"
	"os"

	"online.welkin.version-saver/internal/config"
	"online.welkin.version-saver/internal/database"
	"online.welkin.version-saver/internal/handler"
	"online.welkin.version-saver/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.Load()

	// 初始化数据库
	db, err := database.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// 自动迁移数据库表
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	// 初始化服务
	versionService := service.NewVersionService(db)

	// 初始化处理器
	versionHandler := handler.NewVersionHandler(versionService)

	// 设置Gin模式
	if os.Getenv("GIN_MODE") == "" {
		gin.SetMode(gin.ReleaseMode)
	}

	// 创建Gin路由
	r := gin.Default()

	// 添加CORS中间件（如果需要）
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 注册路由
	api := r.Group("/api/v1")
	{
		api.POST("/save", versionHandler.SaveText)
		api.GET("/versions", versionHandler.ListVersions)
		api.GET("/version/:id", versionHandler.GetVersion)
		api.GET("/latest", versionHandler.GetLatest)
		api.GET("/names", versionHandler.ListNames)
	}

	// 启动服务器
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
