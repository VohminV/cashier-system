// frontend/src/services/customerService.ts
import API from './api';

export interface Customer {
  id: number;
  full_name: string;
  account_number: string;
  address: string;
  phone?: string;
}

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  const response = await API.get('/customers/search', {
    params: { q: query },
  });
  return response.data;
};