package route

import (
	"donation-service/internal/api/handler"

	"github.com/gin-gonic/gin"
)

func SetUpDonationRoutes(r *gin.Engine, h handler.DonationHandler) {
	privateDonationRoutes := r.Group("/donations")
	privateDonationRoutes.POST("", h.CreateDonateTransaction())
	privateDonationRoutes.GET("/:id", h.GetTransactionByID())
	privateDonationRoutes.POST("/donate", h.GetDonateTransactions())
	privateDonationRoutes.POST("/receive", h.GetReceiveDonateTransaction())

	publicDonationRoutes := r.Group("/vnpay")
	publicDonationRoutes.GET("/handle-payment", h.HandleVNPayResult())

	privateWalletRoutes := r.Group("/wallets")
	privateWalletRoutes.GET("/self", h.GetChannelWallet())
}
