
export const STORAGE_KEY = 'smart_qr_employees_v2';

// Unique bucket ID for this application to sync across devices
// We use kvdb.io which is a simple public KV store for client-side demos
export const SYNC_URL = 'https://kvdb.io/S2zH9f7m6k3j1p4q8t5r/employee_data';

export const EXCEL_HEADERS = {
  EMPLOYEE_ID: 'Empoyee_ID', // Using the exact spelling from the user's prompt
  EMPLOYEE_NAME: 'Employee_Name',
  MEAL_TYPE: 'Meal_Type',
  COMPANY_NAME: 'Company_Name',
  CAMP_ALLOCATION: 'Camp_Allocation',
  ACCESS_CARD: 'Access_Card',
  CARD_NUMBER: 'Card_Number'
};
