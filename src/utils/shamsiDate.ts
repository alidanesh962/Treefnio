import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern' });

export class ShamsiDate {
  static format(date: string | number | Date, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date).format(format);
  }

  static parse(shamsiDate: string, format: string = 'jYYYY/jMM/jDD'): Date {
    return moment(shamsiDate, format).toDate();
  }

  static getCurrentShamsiDate(): string {
    return moment().format('jYYYY/jMM/jDD');
  }

  static isValidShamsiDate(date: string, format: string = 'jYYYY/jMM/jDD'): boolean {
    return moment(date, format).isValid();
  }

  static compareShamsiDates(date1: string, date2: string, format: string = 'jYYYY/jMM/jDD'): number {
    const m1 = moment(date1, format);
    const m2 = moment(date2, format);
    if (m1.isBefore(m2)) return -1;
    if (m1.isAfter(m2)) return 1;
    return 0;
  }

  static addDays(date: string, days: number, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date, format).add(days, 'days').format(format);
  }

  static subtractDays(date: string, days: number, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date, format).subtract(days, 'days').format(format);
  }

  static getMonthStart(date: string, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date, format).startOf('jMonth').format(format);
  }

  static getMonthEnd(date: string, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date, format).endOf('jMonth').format(format);
  }

  static getYearStart(date: string, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date, format).startOf('jYear').format(format);
  }

  static getYearEnd(date: string, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(date, format).endOf('jYear').format(format);
  }

  static getDaysBetween(startDate: string, endDate: string, format: string = 'jYYYY/jMM/jDD'): number {
    const start = moment(startDate, format);
    const end = moment(endDate, format);
    return end.diff(start, 'days');
  }

  static getMonthsBetween(startDate: string, endDate: string, format: string = 'jYYYY/jMM/jDD'): number {
    const start = moment(startDate, format);
    const end = moment(endDate, format);
    return end.diff(start, 'months');
  }

  static getYearsBetween(startDate: string, endDate: string, format: string = 'jYYYY/jMM/jDD'): number {
    const start = moment(startDate, format);
    const end = moment(endDate, format);
    return end.diff(start, 'years');
  }

  static toGregorian(shamsiDate: string, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(shamsiDate, format).format('YYYY-MM-DD');
  }

  static fromGregorian(gregorianDate: string | Date, format: string = 'jYYYY/jMM/jDD'): string {
    return moment(gregorianDate).format(format);
  }
}

