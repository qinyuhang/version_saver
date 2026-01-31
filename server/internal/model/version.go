package model

import (
	"time"

	"gorm.io/gorm"
)

// Version 表示一个文本版本
type Version struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	Name      string         `gorm:"uniqueIndex:idx_name_version_num" json:"name"`
	VersionNum int           `gorm:"uniqueIndex:idx_name_version_num;not null" json:"version_num"` // 该 name 下的第几个版本，从 1 递增
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	Content   string         `gorm:"type:text" json:"content"` // 长文本内容
}

// TableName 指定表名
func (Version) TableName() string {
	return "versions"
}
