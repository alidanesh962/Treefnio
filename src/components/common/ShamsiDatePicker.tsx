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
              sx={{
                minWidth: 200,
                '& .MuiInputBase-root': {
                  backgroundColor: 'rgb(31, 41, 55)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'rgb(229, 231, 235)',
                },
                '& .MuiIconButton-root': {
                  color: 'rgb(156, 163, 175)',
                },
                '& .MuiInputLabel-root': {
                  color: 'rgb(156, 163, 175)',
                  '&.Mui-focused': {
                    color: 'rgb(209, 213, 219)',
                  }
                }
              }}
            />
          ),
        }}
        format="jYYYY/jMM/jDD"
        slotProps={{
          popper: {
            sx: {
              '& .MuiPaper-root': {
                backgroundColor: 'rgb(31, 41, 55)',
                color: 'rgb(229, 231, 235)',
                '& .MuiPickersDay-root': {
                  color: 'rgb(229, 231, 235)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                    },
                  },
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  color: 'rgb(156, 163, 175)',
                },
                '& .MuiPickersCalendarHeader-label': {
                  color: 'rgb(229, 231, 235)',
                },
                '& .MuiIconButton-root': {
                  color: 'rgb(156, 163, 175)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  }
                },
              },
            },
          },
        }}
      />
    </LocalizationProvider>
  );
} 