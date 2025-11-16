package repo

import "gorm.io/gorm"

type TransactionManager interface {
	ExecTransaction(fn func(tx *gorm.DB) error) error
}

type transactionManager struct {
	db *gorm.DB
}

func (t *transactionManager) ExecTransaction(fn func(tx *gorm.DB) error) error {
	return t.db.Transaction(fn)
}

func NewTransactionManager(db *gorm.DB) TransactionManager {
	return &transactionManager{
		db: db,
	}
}
