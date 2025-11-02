// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
        return 'Email is required';
    }

    if (!emailRegex.test(email)) {
        return 'Invalid email format';
    }

    return '';
};

// Password validation
export const validatePassword = (password) => {
    if (!password) {
        return 'Password is required';
    }

    if (password.length < 6) {
        return 'Password must be at least 6 characters';
    }

    return '';
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
    if (!confirmPassword) {
        return 'Please confirm your password';
    }

    if (password !== confirmPassword) {
        return 'Passwords do not match';
    }

    return '';
};

// Name validation
export const validateName = (name, fieldName = 'Name') => {
    if (!name) {
        return `${fieldName} is required`;
    }

    if (name.length < 2) {
        return `${fieldName} must be at least 2 characters`;
    }

    return '';
};