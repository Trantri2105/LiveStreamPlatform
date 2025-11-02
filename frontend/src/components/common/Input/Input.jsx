import React, { useState } from 'react';
import './Input.css';

const Input = ({
                   label,
                   type = 'text',
                   name,
                   value,
                   onChange,
                   placeholder,
                   error,
                   disabled = false,
                   required = false,
                   icon,
                   showPasswordToggle = false,
               }) => {
    const [showPassword, setShowPassword] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    return (
        <div className="input-group">
            {label && (
                <label htmlFor={name} className="input-label">
                    {label} {required && <span className="required">*</span>}
                </label>
            )}

            <div className="input-wrapper">
                {icon && <span className="input-icon">{icon}</span>}

                <input
                    id={name}
                    type={inputType}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`input-field ${error ? 'input-error' : ''} ${icon ? 'input-with-icon' : ''}`}
                />

                {type === 'password' && showPasswordToggle && (
                    <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                )}
            </div>

            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;