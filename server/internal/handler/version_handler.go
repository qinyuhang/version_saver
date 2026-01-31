package handler

import (
	"net/http"
	"strconv"

	"online.welkin.version-saver/internal/service"

	"github.com/gin-gonic/gin"
)

type VersionHandler struct {
	service *service.VersionService
}

func NewVersionHandler(service *service.VersionService) *VersionHandler {
	return &VersionHandler{service: service}
}

// SaveTextRequest 保存文本的请求体
type SaveTextRequest struct {
	Content string `json:"content" binding:"required"`
	Name    string `json:"name" binding:"required"`
}

// SaveText 保存文本内容（创建新版本）
func (h *VersionHandler) SaveText(c *gin.Context) {
	var req SaveTextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	version, err := h.service.SaveText(req.Content, req.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save version: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, version)
}

// GetVersion 根据ID获取版本
func (h *VersionHandler) GetVersion(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid version ID"})
		return
	}

	version, err := h.service.GetVersion(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Version not found"})
		return
	}

	c.JSON(http.StatusOK, version)
}

// GetLatest 根据 name 获取最新版本
func (h *VersionHandler) GetLatest(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	version, err := h.service.GetLatest(name)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "No versions found"})
		return
	}

	c.JSON(http.StatusOK, version)
}

// ListVersions 根据 name 列出版本
func (h *VersionHandler) ListVersions(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	versions, total, err := h.service.ListVersions(name, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list versions: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"versions": versions,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// ListNames 返回所有不重复的 name
func (h *VersionHandler) ListNames(c *gin.Context) {
	names, err := h.service.ListNames()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list names: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"names": names})
}
