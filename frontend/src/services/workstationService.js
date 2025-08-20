// frontend/src/services/workstationService.js
import API from './api';

/**
 * GET /workstations
 * Получает список доступных кассовых мест
 */
export const getWorkstations = () => {
  return API.get('/workstations');
};

/**
 * GET /workstations/{id}
 * Получает детальную информацию о кассовом месте
 */
export const getWorkstationById = (id) => {
  return API.get(`/workstations/${id}`);
};

/**
 * PUT /workstations/{id}/assign
 * Привязывает кассира к месту
 */
export const assignWorkstation = (wsId, cashierId) => {
  return API.put(`/workstations/${wsId}/assign`, { cashier_id: cashierId });
};

/**
 * PUT /workstations/{id}/unassign
 * Отвязывает кассира от места
 */
export const unassignWorkstation = (wsId) => {
  return API.put(`/workstations/${wsId}/unassign`);
};