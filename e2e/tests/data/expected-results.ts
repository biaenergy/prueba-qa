export const credentials = {
  email: process.env.E2E_EMAIL ?? 'admin@energia.local',
  password: process.env.E2E_PASSWORD ?? 'admin123',
}

export const expectedAnomalies = [
  {
    priority: '1',
    meterId: 'M-109',
    type: 'Anomalía real',
    severity: 'Alta',
    action: 'Investigar',
  },
  {
    priority: '2',
    meterId: 'M-112',
    type: 'Calidad de datos',
    severity: 'Alta',
    action: 'Validar medidor',
  },
  {
    priority: '3',
    meterId: 'M-104',
    type: 'Anomalía explicable',
    severity: 'Media',
    action: 'Validar operación',
  },
  {
    priority: '4',
    meterId: 'M-106',
    type: 'Falso positivo',
    severity: 'Baja',
    action: 'No escalar',
  },
] as const
