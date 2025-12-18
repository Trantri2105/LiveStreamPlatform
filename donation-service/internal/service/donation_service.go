package service

import (
	"context"
	"donation-service/internal/model"
	"donation-service/internal/repo"
	vnpay_client "donation-service/internal/vnpay-client"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type DonationService interface {
	CreateDonateTransaction(ctx context.Context, donateTx model.DonateTransaction) (string, error)
	HandleVNPayResult(ctx context.Context, response vnpay_client.VNPayResponse) error
	CreateWallet(ctx context.Context, wallet model.Wallet) error
	GetChannelWallet(ctx context.Context, channelID string) (model.Wallet, error)
	GetDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error)
	GetReceiveDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error)
	GetTransactionByID(ctx context.Context, transactionID string) (model.DonateTransaction, error)
	GetDonationStats(fromDate, toDate time.Time, groupBy string, channelID string) ([]model.StatisticResult, error)
	GetReceivedDonationStats(fromDate, toDate time.Time, groupBy string, channelID string) ([]model.StatisticResult, error)
}

type donationService struct {
	txManager    repo.TransactionManager
	kafkaWriter  *kafka.Writer
	donationRepo repo.DonationRepository
	vnPayClient  vnpay_client.VNPayClient
	logger       *zap.Logger
}

func (d *donationService) GetDonationStats(fromDate, toDate time.Time, groupBy string, channelID string) ([]model.StatisticResult, error) {
	return d.donationRepo.GetDonationStats(fromDate, toDate, groupBy, channelID)
}

func (d *donationService) GetReceivedDonationStats(fromDate, toDate time.Time, groupBy string, channelID string) ([]model.StatisticResult, error) {
	return d.donationRepo.GetReceivedDonationStats(fromDate, toDate, groupBy, channelID)
}

func (d *donationService) GetTransactionByID(ctx context.Context, transactionID string) (model.DonateTransaction, error) {
	return d.donationRepo.GetDonateTransactionByID(ctx, transactionID)
}

func (d *donationService) GetDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error) {
	return d.donationRepo.GetDonateTransaction(ctx, channelID, fromTime, toTime, limit, offset)
}

func (d *donationService) GetReceiveDonateTransaction(ctx context.Context, channelID string, fromTime time.Time, toTime time.Time, limit, offset int) ([]model.DonateTransaction, error) {
	return d.donationRepo.GetReceiveDonateTransaction(ctx, channelID, fromTime, toTime, limit, offset)
}

func (d *donationService) CreateDonateTransaction(ctx context.Context, donateTx model.DonateTransaction) (string, error) {
	donateTx.ID = uuid.NewString()
	donateTx.Status = model.TransactionStatusPending
	err := d.donationRepo.CreateDonateTransaction(ctx, donateTx)
	if err != nil {
		return "", err
	}
	paymentURL := d.vnPayClient.CreatePaymentURL(donateTx.ID, donateTx.Amount, "127.0.0.1", "Thanh toan donate livestream")
	return paymentURL, nil
}

func (d *donationService) HandleVNPayResult(ctx context.Context, response vnpay_client.VNPayResponse) error {
	if response.VNPResponseCode != "00" {
		donateTx := model.DonateTransaction{
			ID:     response.VNPTxnRef,
			Status: model.TransactionStatusFailed,
		}
		err := d.donationRepo.UpdateDonateTransaction(ctx, donateTx)
		return err
	}
	var donateTx model.DonateTransaction
	err := d.txManager.ExecTransaction(func(tx *gorm.DB) error {
		donateTx = model.DonateTransaction{
			ID:     response.VNPTxnRef,
			Status: model.TransactionStatusSuccess,
		}
		err := d.donationRepo.WithTransaction(tx).UpdateDonateTransaction(ctx, donateTx)
		if err != nil {
			return err
		}
		donateTx, err = d.donationRepo.WithTransaction(tx).GetDonateTransactionByID(ctx, response.VNPTxnRef)
		if err != nil {
			return err
		}
		err = d.donationRepo.WithTransaction(tx).UpdateWalletAmount(ctx, donateTx.ChannelID, donateTx.Amount)
		return err
	})
	if err != nil {
		return err
	}
	go d.publishDonateChat(donateTx)
	return nil
}

func (d *donationService) publishDonateChat(donateTx model.DonateTransaction) {
	b, err := json.Marshal(donateTx)
	if err != nil {
		d.logger.Error("marshal transaction err", zap.Error(err))
		return
	}
	message := kafka.Message{
		Value: b,
		Key:   []byte(donateTx.ID),
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
	err = d.kafkaWriter.WriteMessages(ctx, message)
	cancel()
	if err != nil {
		d.logger.Error("write messages err", zap.Error(err))
		return
	}
	return
}

func (d *donationService) CreateWallet(ctx context.Context, wallet model.Wallet) error {
	return d.donationRepo.CreateWallet(ctx, wallet)
}

func (d *donationService) GetChannelWallet(ctx context.Context, channelID string) (model.Wallet, error) {
	return d.donationRepo.GetChannelWallet(ctx, channelID)
}

func NewDonationService(txManager repo.TransactionManager, kafkaWriter *kafka.Writer, donationRepo repo.DonationRepository, vnPayClient vnpay_client.VNPayClient, logger *zap.Logger) DonationService {
	return &donationService{
		txManager:    txManager,
		kafkaWriter:  kafkaWriter,
		donationRepo: donationRepo,
		vnPayClient:  vnPayClient,
		logger:       logger,
	}
}
