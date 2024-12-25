import React from 'react';
import { formatToJalaliInput, parseJalaliInput, isValidJalaliDate } from '../../utils/dateUtils';

interface PersianDateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const PersianDateInput: React.FC<PersianDateInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'انتخاب تاریخ'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || isValidJalaliDate(newValue)) {
      onChange(newValue);
    }
  };

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      className={`${className} ltr`}
      placeholder={placeholder}
      pattern="\d{4}/\d{2}/\d{2}"
      title="تاریخ را به فرمت 1402/08/01 وارد کنید"
    />
  );
}; 