import moment from 'moment-jalaali';
import { formatToJalali, parseJalali } from '../utils/dateUtils';

export const convertToJalaliTimestamp = (date: string | number | Date): number => {
  return moment(date).valueOf();
};

export const convertFromJalaliTimestamp = (timestamp: number): string => {
  return formatToJalali(timestamp);
};

export const convertToJalaliString = (date: string | number | Date): string => {
  return formatToJalali(date);
};

export const convertFromJalaliString = (jalaliDate: string): number => {
  return parseJalali(jalaliDate).getTime();
};

export const isValidJalaliTimestamp = (timestamp: number): boolean => {
  return moment(timestamp).isValid();
};

export const getCurrentJalaliTimestamp = (): number => {
  return Date.now();
};

export const compareDates = (date1: string, date2: string): number => {
  const timestamp1 = convertFromJalaliString(date1);
  const timestamp2 = convertFromJalaliString(date2);
  return timestamp1 - timestamp2;
}; 