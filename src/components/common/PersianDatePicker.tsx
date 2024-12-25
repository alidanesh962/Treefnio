import React, { useMemo, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment-jalaali';
import { registerLocale } from 'react-datepicker';
import { Locale } from 'date-fns';

interface PersianDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

// Register Persian locale
const persianLocale: Partial<Locale> = {
  localize: {
    month: (n: number) => [
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
    ][n],
    day: (n: number) => [
      'یکشنبه',
      'دوشنبه',
      'سه‌شنبه',
      'چهارشنبه',
      'پنجشنبه',
      'جمعه',
      'شنبه',
    ][n],
    dayPeriod: () => '',
    era: () => '',
    ordinalNumber: () => '',
    quarter: () => '',
  },
  formatLong: {
    date: () => 'yyyy/MM/dd',
    time: () => 'HH:mm',
    dateTime: () => 'yyyy/MM/dd HH:mm',
  },
  formatRelative: () => '',
  match: {
    ordinalNumber: () => ({ value: 1, rest: '' }),
    era: () => ({ value: 1, rest: '' }),
    quarter: () => ({ value: 1, rest: '' }),
    month: () => ({ value: 1, rest: '' }),
    day: () => ({ value: 1, rest: '' }),
    dayPeriod: () => ({ value: 'am', rest: '' }),
  },
  options: {
    weekStartsOn: 6,
    firstWeekContainsDate: 1,
  },
};

registerLocale('fa', persianLocale as Locale);

export const PersianDatePicker: React.FC<PersianDatePickerProps> = React.memo(({
  value,
  onChange,
  className = '',
  placeholder = 'انتخاب تاریخ'
}) => {
  // Convert string date to Date object for DatePicker
  const selectedDate = useMemo(() => {
    if (!value) return null;
    return moment(value, 'jYYYY/jMM/jDD').toDate();
  }, [value]);

  // Convert Date object to Jalali string
  const handleChange = useCallback((date: Date | null) => {
    if (!date) {
      onChange('');
      return;
    }
    const jalaliDate = moment(date).format('jYYYY/jMM/jDD');
    onChange(jalaliDate);
  }, [onChange]);

  return (
    <div className={`persian-datepicker ${className}`}>
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="yyyy/MM/dd"
        placeholderText={placeholder}
        locale="fa"
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={15}
        popperClassName="persian-datepicker-popper"
        popperPlacement="bottom-start"
      />
    </div>
  );
});

PersianDatePicker.displayName = 'PersianDatePicker'; 