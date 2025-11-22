package vnpay_client

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"
)

type VNPayClient interface {
	CreatePaymentURL(orderID string, amount int64, clientIP string, orderInfo string) string
}

type client struct {
	TmnCode    string
	HashSecret string
	PayURL     string
	ReturnURL  string
}

func (cli *client) CreatePaymentURL(orderID string, amount int64, clientIP string, orderInfo string) string {
	v := url.Values{}
	v.Set("vnp_Version", "2.1.0")
	v.Set("vnp_Command", "pay")
	v.Set("vnp_TmnCode", cli.TmnCode)
	v.Set("vnp_Amount", cli.formatAmount(amount))
	v.Set("vnp_CreateDate", time.Now().Format("20060102150405"))
	v.Set("vnp_CurrCode", "VND")
	v.Set("vnp_IpAddr", clientIP)
	v.Set("vnp_Locale", "vn")
	v.Set("vnp_OrderInfo", orderInfo)
	v.Set("vnp_OrderType", "other")
	v.Set("vnp_ReturnUrl", cli.ReturnURL)
	v.Set("vnp_ExpireDate", time.Now().Add(24*time.Hour).Format("20060102150405"))
	v.Set("vnp_TxnRef", orderID)

	hashData := cli.buildHashData(v)

	secureHash := cli.hmacSHA512(cli.HashSecret, hashData)
	v.Set("vnp_SecureHash", secureHash)

	paymentURL := cli.PayURL + "?" + v.Encode()
	return paymentURL
}

func (cli *client) formatAmount(amount int64) string {
	return strconv.FormatInt(amount*100, 10)
}

func (cli *client) buildHashData(v url.Values) string {
	var keys []string
	for k := range v {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var sb strings.Builder
	for i, k := range keys {
		if k == "vnp_SecureHash" || k == "vnp_SecureHashType" {
			continue
		}
		value := url.Values{}
		value.Set(k, v.Get(k))
		if i > 0 {
			sb.WriteByte('&')
		}
		sb.WriteString(value.Encode())
	}
	return sb.String()
}

func (cli *client) hmacSHA512(secret, data string) string {
	mac := hmac.New(sha512.New, []byte(secret))
	mac.Write([]byte(data))
	return strings.ToUpper(hex.EncodeToString(mac.Sum(nil)))
}

type VNPayResponse struct {
	VNPTmnCode           string `form:"vnp_TmnCode"`
	VNPAmount            string `form:"vnp_Amount"`
	VNPBankCode          string `form:"vnp_BankCode"`
	VNPCardType          string `form:"vnp_CardType"`
	VNPPayDate           string `form:"vnp_PayDate"`
	VNPOrderInfo         string `form:"vnp_OrderInfo"`
	VNPTransactionNo     string `form:"vnp_TransactionNo"`
	VNPResponseCode      string `form:"vnp_ResponseCode"`
	VNPTransactionStatus string `form:"vnp_TransactionStatus"`
	VNPTxnRef            string `form:"vnp_TxnRef"`
	VNPSecureHash        string `form:"vnp_SecureHash"`
}

func NewVNPayClient(tmnCode string, hashSecret string, payURL string, returnURL string) VNPayClient {
	return &client{
		TmnCode:    tmnCode,
		HashSecret: hashSecret,
		PayURL:     payURL,
		ReturnURL:  returnURL,
	}
}
