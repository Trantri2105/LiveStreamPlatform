package service

import (
	apperrors "auth-service/internal/error"
	"auth-service/internal/model"
	"auth-service/internal/repository"
	"context"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	CreateUser(ctx context.Context, user model.User) (model.User, error)
	GetUserByEmail(ctx context.Context, email string) (model.User, error)
	GetUserById(ctx context.Context, id string) (model.User, error)
	UpdateUserByID(ctx context.Context, user model.User) error
	UpdateUserPassword(ctx context.Context, id string, currentPassword string, newPassword string) error
	// GetUsers will sort user by ID
	GetUsers(ctx context.Context, userEmail string, sortOrder string, limit, offset int) ([]model.User, error)
}

type userService struct {
	userRepo repository.UserRepository
}

func (u *userService) GetUsers(ctx context.Context, userEmail string, sortOrder string, limit, offset int) ([]model.User, error) {
	users, err := u.userRepo.GetUsers(ctx, userEmail, sortOrder, limit, offset)
	if err != nil {
		return nil, err
	}
	return users, nil
}

func (u *userService) CreateUser(ctx context.Context, user model.User) (model.User, error) {
	user.Role = model.RoleUser
	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return model.User{}, fmt.Errorf("UserService.Register hashing password err: %w", err)
	}
	user.Password = string(hash)
	createdUser, err := u.userRepo.CreateUser(ctx, user)
	if err != nil {
		return model.User{}, fmt.Errorf("userService.CreateUser: %w", err)
	}
	return createdUser, nil
}

func (u *userService) GetUserByEmail(ctx context.Context, email string) (model.User, error) {
	user, err := u.userRepo.GetUserByEmail(ctx, email)
	if err != nil {
		return model.User{}, fmt.Errorf("userService.GetUserByEmail: %w", err)
	}
	return user, nil
}

func (u *userService) GetUserById(ctx context.Context, id string) (model.User, error) {
	user, err := u.userRepo.GetUserByID(ctx, id)
	if err != nil {
		return model.User{}, fmt.Errorf("userService.GetUserById: %w", err)
	}
	return user, nil
}

func (u *userService) UpdateUserByID(ctx context.Context, user model.User) error {
	err := u.userRepo.UpdateUserByID(ctx, user)
	if err != nil {
		return fmt.Errorf("userService.UpdateUserByID: %w", err)
	}
	return nil
}

func (u *userService) UpdateUserPassword(ctx context.Context, id string, currentPassword string, newPassword string) error {
	user, err := u.userRepo.GetUserByID(ctx, id)
	if err != nil {
		return fmt.Errorf("userService.UpdateUserPassword: %w", err)
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(currentPassword))
	if err != nil {
		return fmt.Errorf("userService.UpdateUserPassword: %w", apperrors.ErrInvalidPassword)
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("userService.UpdateUserPassword hashing password: %w", err)
	}
	user.Password = string(hash)
	err = u.userRepo.UpdateUserByID(ctx, model.User{ID: id, Password: user.Password})
	if err != nil {
		return fmt.Errorf("userService.UpdateUserPassword: %w", err)
	}
	return nil
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{
		userRepo: userRepo,
	}
}
