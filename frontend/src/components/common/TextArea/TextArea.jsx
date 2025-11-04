import React from 'react';
import './TextArea.css';

const TextArea = ({
                      label,
                      name,
                      value,
                      onChange,
                      placeholder,
                      error,
                      disabled = false,
                      required = false,
                      rows = 4,
                      maxLength,
                      className = '',
                  }) => {
    return (
        <div className="textarea-group">
            {label && (
                <label htmlFor={name} className="textarea-label">
                    {label} {required && <span className="required">*</span>}
                </label>
            )}

            <textarea
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                className={`textarea-field ${error ? 'textarea-error' : ''} ${className}`}
            />

            {maxLength && (
                <div className="textarea-counter">
                    {value?.length || 0} / {maxLength}
                </div>
            )}

            {error && <span className="textarea-error-message">{error}</span>}
        </div>
    );
};

export default TextArea;