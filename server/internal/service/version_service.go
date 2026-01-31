package service

import (
	"online.welkin.version-saver/internal/model"

	"gorm.io/gorm"
)

type VersionService struct {
	db *gorm.DB
}

func NewVersionService(db *gorm.DB) *VersionService {
	return &VersionService{db: db}
}

// SaveText 保存新的文本版本，并为该 name 分配递增的 version_num
func (s *VersionService) SaveText(content string, name string) (*model.Version, error) {
	var nextNum int
	err := s.db.Transaction(func(tx *gorm.DB) error {
		var maxNum int
		if err := tx.Model(&model.Version{}).Where("name = ?", name).Select("COALESCE(MAX(version_num), 0)").Scan(&maxNum).Error; err != nil {
			return err
		}
		nextNum = maxNum + 1
		version := &model.Version{
			Name:      name,
			VersionNum: nextNum,
			Content:   content,
		}
		return tx.Create(version).Error
	})
	if err != nil {
		return nil, err
	}
	// 返回刚创建的那条记录（含 ID、CreatedAt 等）
	var v model.Version
	if err := s.db.Where("name = ? AND version_num = ?", name, nextNum).Last(&v).Error; err != nil {
		return nil, err
	}
	return &v, nil
}

// GetVersion 根据ID获取版本
func (s *VersionService) GetVersion(id uint) (*model.Version, error) {
	var version model.Version
	if err := s.db.First(&version, id).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

// GetLatest 根据 name 获取最新版本
func (s *VersionService) GetLatest(name string) (*model.Version, error) {
	var version model.Version
	query := s.db.Order("created_at DESC")
	if name != "" {
		query = query.Where("name = ?", name)
	}
	if err := query.First(&version).Error; err != nil {
		return nil, err
	}
	return &version, nil
}

// ListVersions 根据 name 列出版本（按创建时间倒序）
func (s *VersionService) ListVersions(name string, limit, offset int) ([]model.Version, int64, error) {
	var versions []model.Version
	var total int64

	baseQuery := s.db.Model(&model.Version{})
	if name != "" {
		baseQuery = baseQuery.Where("name = ?", name)
	}
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query := s.db.Order("created_at DESC")
	if name != "" {
		query = query.Where("name = ?", name)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	if err := query.Find(&versions).Error; err != nil {
		return nil, 0, err
	}

	return versions, total, nil
}

// ListNames 返回所有不重复的 name（按名称排序）
func (s *VersionService) ListNames() ([]string, error) {
	var names []string
	err := s.db.Model(&model.Version{}).Distinct("name").Order("name").Pluck("name", &names).Error
	if err != nil {
		return nil, err
	}
	return names, nil
}
