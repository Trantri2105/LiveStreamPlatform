package repo

import (
	"context"
	apperrors "donation-service/internal/error"
	"donation-service/internal/model"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgconn"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DonationRepository interface {
	CreateDonateTransaction(ctx context.Context, donateTx model.DonateTransaction) error
	UpdateDonateTransaction(ctx context.Context, donateTx model.DonateTransaction) error
	CreateWallet(ctx context.Context, wallet model.Wallet) error
	GetChannelWallet(ctx context.Context, channelID string) (model.Wallet, error)
	GetDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error)
	GetReceiveDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error)
	GetDonateTransactionByID(ctx context.Context, transactionID string) (model.DonateTransaction, error)
	UpdateWalletAmount(ctx context.Context, walletID string, amount int64) error
	WithTransaction(tx *gorm.DB) DonationRepository
}

type donationRepository struct {
	db *gorm.DB
}

func (d *donationRepository) UpdateWalletAmount(ctx context.Context, walletID string, amount int64) error {
	res := d.db.WithContext(ctx).Model(&model.Wallet{}).Where("channel_id = ?", walletID).Update("amount", gorm.Expr("amount + ?", amount))
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return apperrors.ErrWalletNotFound
	}
	return nil
}

func (d *donationRepository) GetDonateTransactionByID(ctx context.Context, transactionID string) (model.DonateTransaction, error) {
	var donateTx model.DonateTransaction
	result := d.db.WithContext(ctx).Where("id = ?", transactionID).First(&donateTx)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return model.DonateTransaction{}, apperrors.ErrTransactionNotFound
		}
		return model.DonateTransaction{}, result.Error
	}
	return donateTx, nil
}

func (d *donationRepository) CreateWallet(ctx context.Context, wallet model.Wallet) error {
	result := d.db.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&wallet)
	if result.Error != nil {
		var pgErr *pgconn.PgError
		if errors.As(result.Error, &pgErr) && pgErr.Code == "23505" {
			return apperrors.ErrWalletAlreadyExists
		}
		return fmt.Errorf("channelRepository.CreateChannel: %w", result.Error)
	}
	return nil
}

func (d *donationRepository) WithTransaction(tx *gorm.DB) DonationRepository {
	return &donationRepository{
		db: tx,
	}
}

func (d *donationRepository) CreateDonateTransaction(ctx context.Context, donateTx model.DonateTransaction) error {
	return d.db.WithContext(ctx).Create(&donateTx).Error
}

func (d *donationRepository) UpdateDonateTransaction(ctx context.Context, donateTx model.DonateTransaction) error {
	result := d.db.WithContext(ctx).Updates(&donateTx)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return apperrors.ErrTransactionNotFound
	}
	return nil
}

func (d *donationRepository) GetChannelWallet(ctx context.Context, channelID string) (model.Wallet, error) {
	var wallet model.Wallet
	result := d.db.WithContext(ctx).Where("channel_id = ?", channelID).First(&wallet)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return wallet, apperrors.ErrWalletNotFound
		}
		return wallet, result.Error
	}
	return wallet, nil
}

func (d *donationRepository) GetDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error) {
	var transactions []model.DonateTransaction
	result := d.db.WithContext(ctx).Where("donor_channel_id = ? AND created_at >= ? AND created_at < ?", channelID, fromTime, toTime).Limit(limit).Offset(offset).Order("created_at DESC").Find(&transactions)
	if result.Error != nil {
		return transactions, result.Error
	}
	return transactions, nil
}

func (d *donationRepository) GetReceiveDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error) {
	var transactions []model.DonateTransaction
	result := d.db.WithContext(ctx).Where("channel_id = ? AND created_at >= ? AND created_at < ?", channelID, fromTime, toTime).Limit(limit).Offset(offset).Order("created_at DESC").Find(&transactions)
	if result.Error != nil {
		return transactions, result.Error
	}
	return transactions, nil
}

func NewDonationRepository(db *gorm.DB) DonationRepository {
	return &donationRepository{
		db: db,
	}
}
