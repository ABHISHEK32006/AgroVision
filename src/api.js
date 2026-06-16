// ============================================================
//  Agrovision v2 — API helper
//  All calls go to the Express backend at /api/*
// ============================================================
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function call(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  login: (username, password)        => call('POST', '/auth/login', { username, password }),

  // Dashboard
  dashboard: ()                       => call('GET', '/dashboard'),

  // Farmers
  getFarmers: ()                      => call('GET', '/farmers'),
  addFarmer: (body)                   => call('POST', '/farmers', body),
  updateFarmer: (id, body)            => call('PUT', `/farmers/${id}`, body),
  deleteFarmer: (id)                  => call('DELETE', `/farmers/${id}`),

  // Farms
  getFarms: (params = {})             => call('GET', '/farms?' + new URLSearchParams(params)),
  addFarm: (body)                     => call('POST', '/farms', body),
  updateFarm: (id, body)              => call('PUT', `/farms/${id}`, body),

  // Crops
  getCrops: (params = {})             => call('GET', '/crops?' + new URLSearchParams(params)),

  // Equipment
  getEquipment: (params = {})         => call('GET', '/equipment?' + new URLSearchParams(params)),
  addEquipment: (body)                => call('POST', '/equipment', body),
  updateEquipment: (id, body)         => call('PUT', `/equipment/${id}`, body),
  deleteEquipment: (id)               => call('DELETE', `/equipment/${id}`),

  // Fertilizers
  getFertilizers: (params = {})       => call('GET', '/fertilizers?' + new URLSearchParams(params)),
  addFertilizer: (body)               => call('POST', '/fertilizers', body),
  updateFertilizer: (id, body)        => call('PUT', `/fertilizers/${id}`, body),
  applyFertilizer: (id, body)         => call('PATCH', `/fertilizers/${id}/apply`, body),
  deleteFertilizer: (id)              => call('DELETE', `/fertilizers/${id}`),

  // Pesticides
  getPesticides: (params = {})        => call('GET', '/pesticides?' + new URLSearchParams(params)),
  addPesticide: (body)                => call('POST', '/pesticides', body),
  updatePesticide: (id, body)         => call('PUT', `/pesticides/${id}`, body),
  applyPesticide: (id, body)          => call('PATCH', `/pesticides/${id}/apply`, body),
  deletePesticide: (id)               => call('DELETE', `/pesticides/${id}`),

  // Irrigation
  getIrrigation: (params = {})        => call('GET', '/irrigation?' + new URLSearchParams(params)),
  addIrrigation: (body)               => call('POST', '/irrigation', body),
  irrigate: (id, body)                => call('PATCH', `/irrigation/${id}/irrigate`, body),
  updateIrrigation: (id, body)        => call('PUT', `/irrigation/${id}`, body),

  // Alerts & Reminders
  getAlerts: (params = {})            => call('GET', '/alerts?' + new URLSearchParams(params)),
  resolveAlert: (id)                  => call('PATCH', `/alerts/${id}/resolve`, {}),
  getReminders: (farmer_id)           => call('GET', `/reminders?farmer_id=${farmer_id}`),

  // Sensors
  getSensors: (params = {})           => call('GET', '/sensors?' + new URLSearchParams(params)),

  // Labour
  getLabour:    (params = {})         => call('GET', '/labour?' + new URLSearchParams(params)),
  addLabour:    (body)                => call('POST', '/labour', body),
  updateLabour: (id, body)            => call('PUT', `/labour/${id}`, body),
  deleteLabour: (id)                  => call('DELETE', `/labour/${id}`),

  // Finance
  getFinance:    (params = {})        => call('GET', '/finance?' + new URLSearchParams(params)),
  addFinance:    (body)               => call('POST', '/finance', body),
  updateFinance: (id, body)           => call('PUT', `/finance/${id}`, body),
  deleteFinance: (id)                 => call('DELETE', `/finance/${id}`),

  // Admin — reset farmer password
  resetFarmerPassword: (id, password) => call('PATCH', `/farmers/${id}/password`, { password }),
};
