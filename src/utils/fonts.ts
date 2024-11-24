// src/utils/fonts.ts

// Function to convert Persian/Arabic numbers to standard numbers
export const convertPersianToEnglishNumbers = (str: string): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    for (let i = 0; i < 10; i++) {
      str = str.replace(new RegExp(persianNumbers[i], 'g'), i.toString());
    }
    return str;
  };
  
  // Function to convert standard numbers to Persian/Arabic numbers
  export const convertEnglishToPersianNumbers = (str: string): string => {
    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.replace(/[0-9]/g, (d) => persianNumbers[parseInt(d)]);
  };
  
  // Standard Farsi/Arabic strings
  export const PERSIAN_STRINGS = {
    RECIPE: 'دستور پخت',
    PRODUCT: 'محصول',
    PRODUCT_CODE: 'کد محصول',
    NOTES: 'توضیحات',
    TOTAL: 'جمع کل',
    PRINT_DATE: 'تاریخ چاپ',
    PAGE: 'صفحه',
    OF: 'از',
    MATERIAL_NAME: 'نام ماده اولیه',
    AMOUNT: 'مقدار',
    UNIT: 'واحد',
    UNIT_PRICE: 'قیمت واحد (ریال)',
    TOTAL_PRICE: 'قیمت کل (ریال)',
    CURRENCY: 'ریال'
  };