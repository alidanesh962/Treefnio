import moment from 'moment-jalaali';

// Configure moment-jalaali
moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });

export const formatToJalali = (date: Date | string | number): string => {
  return moment(date).format('jYYYY/jMM/jDD');
};

export const parseJalali = (jalaliDate: string): Date => {
  return moment(jalaliDate, 'jYYYY/jMM/jDD').toDate();
};

export const formatToJalaliWithTime = (date: Date | string | number): string => {
  return moment(date).format('jYYYY/jMM/jDD HH:mm');
};

export const formatToJalaliInput = (date: Date | string | number): string => {
  return moment(date).format('jYYYY-jMM-jDD');
};

export const parseJalaliInput = (jalaliDate: string): Date => {
  return moment(jalaliDate, 'jYYYY-jMM-jDD').toDate();
};

export const getCurrentJalaliDate = (): string => {
  return moment().format('jYYYY/jMM/jDD');
};

export const isValidJalaliDate = (date: string): boolean => {
  return moment(date, 'jYYYY/jMM/jDD', true).isValid();
}; 