package handler

import (
	"donation-service/internal/api/dto/request"
	"donation-service/internal/api/dto/response"
	apperrors "donation-service/internal/error"
	"donation-service/internal/model"
	"donation-service/internal/service"
	vnpay_client "donation-service/internal/vnpay-client"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"
)

type DonationHandler interface {
	CreateDonateTransaction() gin.HandlerFunc
	HandleVNPayResult() gin.HandlerFunc
	GetChannelWallet() gin.HandlerFunc
	GetDonateTransactions() gin.HandlerFunc
	GetReceiveDonateTransaction() gin.HandlerFunc
	GetTransactionByID() gin.HandlerFunc
	GetDonationStats() gin.HandlerFunc
	GetReceivedDonationStats() gin.HandlerFunc
}

type donationHandler struct {
	donationService          service.DonationService
	frontendRedirectVNPayURL string
	logger                   *zap.Logger
}

func (d *donationHandler) GetReceivedDonationStats() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.GetHeader("X-User-Id")
		var req struct {
			FromTime string `json:"from_time" binding:"required,datetime=2006-01-02"`
			ToTime   string `json:"to_time" binding:"required,datetime=2006-01-02"`
			GroupBy  string `json:"group_by"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: d.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		startTime, err := time.Parse("2006-01-02", req.FromTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Invalid start date",
			})
			return
		}
		endTime, err := time.Parse("2006-01-02", req.ToTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		if endTime.Before(startTime) {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		endTimeFinal := endTime.AddDate(0, 0, 1)
		if req.GroupBy != "day" && req.GroupBy != "month" {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid group by",
			})
			return
		}
		res, err := d.donationService.GetReceivedDonationStats(startTime, endTimeFinal, req.GroupBy, channelID)
		if err != nil {
			d.logger.Error(fmt.Sprintf("failed to get received donation statistics for channel %s", channelID), zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		c.JSON(http.StatusOK, res)
	}
}

func (d *donationHandler) GetDonationStats() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.GetHeader("X-User-Id")
		var req struct {
			FromTime string `json:"from_time" binding:"required,datetime=2006-01-02"`
			ToTime   string `json:"to_time" binding:"required,datetime=2006-01-02"`
			GroupBy  string `json:"group_by"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: d.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		startTime, err := time.Parse("2006-01-02", req.FromTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Invalid start date",
			})
			return
		}
		endTime, err := time.Parse("2006-01-02", req.ToTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		if endTime.Before(startTime) {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		endTimeFinal := endTime.AddDate(0, 0, 1)
		if req.GroupBy != "day" && req.GroupBy != "month" {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid group by",
			})
			return
		}
		res, err := d.donationService.GetDonationStats(startTime, endTimeFinal, req.GroupBy, channelID)
		if err != nil {
			d.logger.Error(fmt.Sprintf("failed to get donation statistics for channel %s", channelID), zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		c.JSON(http.StatusOK, res)
	}
}

func (d *donationHandler) GetTransactionByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		tx, err := d.donationService.GetTransactionByID(c, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrTransactionNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Message: "transaction not found",
				})
				return
			}
			d.logger.Error("failed to get transaction", zap.String("id", id), zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		authID := c.GetHeader("X-User-Id")
		if tx.ChannelID != authID && tx.DonorChannelID != authID {
			c.JSON(http.StatusUnauthorized, response.Response{
				Message: "unauthorized",
			})
			return
		}
		c.JSON(http.StatusOK, response.DonateTxRes{
			ID:             id,
			ChannelID:      tx.ChannelID,
			StreamID:       tx.StreamID,
			Amount:         tx.Amount,
			DonorChannelID: tx.DonorChannelID,
			DonateMessage:  tx.DonateMessage,
			Status:         tx.Status,
			CreatedAt:      tx.CreatedAt,
		})
	}
}

func (d *donationHandler) GetDonateTransactions() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.GetHeader("X-User-Id")
		var req request.GetDonateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: d.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		startTime, err := time.Parse("2006-01-02", req.FromTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Invalid start date",
			})
			return
		}
		endTime, err := time.Parse("2006-01-02", req.ToTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		if endTime.Before(startTime) {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		endTimeFinal := endTime.AddDate(0, 0, 1)
		donates, err := d.donationService.GetDonateTransaction(c, channelID, startTime, endTimeFinal, req.Limit, req.Offset)
		if err != nil {
			d.logger.Error("GetDonateTransactions error", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		res := make([]response.DonateTxRes, len(donates))
		for i, donate := range donates {
			res[i] = response.DonateTxRes{
				ID:             donate.ID,
				ChannelID:      donate.ChannelID,
				StreamID:       donate.StreamID,
				Amount:         donate.Amount,
				DonorChannelID: donate.DonorChannelID,
				DonateMessage:  donate.DonateMessage,
				Status:         donate.Status,
				CreatedAt:      donate.CreatedAt,
			}
		}
		c.JSON(http.StatusOK, res)
	}
}

func (d *donationHandler) GetReceiveDonateTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		channelID := c.GetHeader("X-User-Id")
		var req request.GetDonateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: d.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		startTime, err := time.Parse("2006-01-02", req.FromTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "Invalid start date",
			})
			return
		}
		endTime, err := time.Parse("2006-01-02", req.ToTime)
		if err != nil {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		if endTime.Before(startTime) {
			c.JSON(http.StatusBadRequest, response.Response{
				Message: "invalid end date",
			})
			return
		}
		endTimeFinal := endTime.AddDate(0, 0, 1)
		donates, err := d.donationService.GetReceiveDonateTransaction(c, channelID, startTime, endTimeFinal, req.Limit, req.Offset)
		if err != nil {
			d.logger.Error("GetDonateTransactions error", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		res := make([]response.DonateTxRes, len(donates))
		for i, donate := range donates {
			res[i] = response.DonateTxRes{
				ID:             donate.ID,
				ChannelID:      donate.ChannelID,
				StreamID:       donate.StreamID,
				Amount:         donate.Amount,
				DonorChannelID: donate.DonorChannelID,
				DonateMessage:  donate.DonateMessage,
				Status:         donate.Status,
				CreatedAt:      donate.CreatedAt,
			}
		}
		c.JSON(http.StatusOK, res)
	}
}

func (*donationHandler) formatValidationError(err validator.FieldError) string {
	switch err.Tag() {
	case "required":
		return fmt.Sprintf("the %s field is required", err.Field())
	case "datetime":
		return fmt.Sprintf("the %s field is not a valid datetime, use YYYY-MM-DD format", err.Field())
	case "gte":
		return fmt.Sprintf("the %s field must be greater than or equal to %s", err.Field(), err.Param())
	case "lte":
		return fmt.Sprintf("the %s field must be less than or equal to %s", err.Field(), err.Param())
	default:
		return fmt.Sprintf("validation failed for %s with tag %s.", err.Field(), err.Tag())
	}
}

func (d *donationHandler) CreateDonateTransaction() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req request.CreateDonateTransactionRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			var validatorError validator.ValidationErrors
			if errors.As(err, &validatorError) {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: d.formatValidationError(validatorError[0]),
				})
			} else {
				c.JSON(http.StatusBadRequest, response.Response{
					Message: "invalid request body",
				})
			}
			return
		}
		id := c.GetHeader("X-User-Id")
		donate := model.DonateTransaction{
			ChannelID:      req.ChannelID,
			StreamID:       req.StreamID,
			Amount:         *req.Amount,
			DonorChannelID: id,
			DonateMessage:  req.DonateMessage,
		}
		paymentURL, err := d.donationService.CreateDonateTransaction(c, donate)
		if err != nil {
			d.logger.Error("failed to create donate transaction", zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: err.Error(),
			})
			return
		}
		c.JSON(http.StatusOK, response.CreateDonateRes{
			PaymentURL: paymentURL,
		})
	}
}

func (d *donationHandler) createRedirectURL(isError bool, txID string) string {
	values := url.Values{}
	if isError {
		values.Add("error", "true")
	} else {
		values.Add("error", "false")
	}
	if txID != "" {
		values.Add("tx_id", txID)
	}
	return fmt.Sprintf("%s?%s", d.frontendRedirectVNPayURL, values.Encode())
}

func (d *donationHandler) HandleVNPayResult() gin.HandlerFunc {
	return func(c *gin.Context) {
		var res vnpay_client.VNPayResponse
		if err := c.ShouldBindQuery(&res); err != nil {
			d.logger.Error("failed to bind request", zap.Error(err))
			c.Redirect(http.StatusFound, d.createRedirectURL(true, ""))
			return
		}
		err := d.donationService.HandleVNPayResult(c, res)
		if err != nil {
			d.logger.Error("failed to handle donation result", zap.Error(err))
			c.Redirect(http.StatusFound, d.createRedirectURL(true, ""))
			return
		}
		c.Redirect(http.StatusFound, d.createRedirectURL(false, res.VNPTxnRef))
	}
}

func (d *donationHandler) GetChannelWallet() gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.GetHeader("X-User-Id")
		wallet, err := d.donationService.GetChannelWallet(c, id)
		if err != nil {
			if errors.Is(err, apperrors.ErrWalletNotFound) {
				c.JSON(http.StatusNotFound, response.Response{
					Message: "wallet not found",
				})
				return
			}
			d.logger.Error(fmt.Sprintf("failed to get wallet for channel %v", id), zap.Error(err))
			c.JSON(http.StatusInternalServerError, response.Response{
				Message: "internal server error",
			})
			return
		}
		c.JSON(http.StatusOK, response.WalletResponse{
			ChannelID: wallet.ChannelID,
			Amount:    wallet.Amount,
			Currency:  wallet.Currency,
		})
	}
}

func NewDonationHandler(donationService service.DonationService, frontendRedirectVNPayURL string, logger *zap.Logger) DonationHandler {
	return &donationHandler{
		donationService:          donationService,
		frontendRedirectVNPayURL: frontendRedirectVNPayURL,
		logger:                   logger,
	}
}
