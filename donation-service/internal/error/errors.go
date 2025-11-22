package apperrors

import "errors"

var ErrWalletNotFound = errors.New("wallet not found")
var ErrWalletAlreadyExists = errors.New("wallet already exists")
var ErrTransactionNotFound = errors.New("transaction not found")
