// frontend/src/services/checkService.ts
import API from './api';

export const createCheck = async (data: any) => {
  const response = await API.post('/checks', data);
  return response.data;
};