import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';
import moment from 'moment-jalaali';
import { ShamsiDate } from '../../utils/shamsiDate';

interface ShamsiDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export default function ShamsiDatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
}: ShamsiDatePickerProps) {
  const handleDateChange = (date: moment.Moment | null) => {
    if (date && date.isValid()) {
      onChange(date.format('jYYYY/jMM/jDD'));
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMomentJalaali}>
      <DatePicker
        label={label}
        value={value ? moment(value, 'jYYYY/jMM/jDD') : null}
        onChange={handleDateChange}
        disabled={disabled}
        slots={{
          textField: (params) => (
            <TextField
              {...params}
              error={error}
              helperText={helperText}
              sx={{ minWidth: 200 }}
            />
          ),
        }}
        format="jYYYY/jMM/jDD"
      />
    </LocalizationProvider>
  );
} 