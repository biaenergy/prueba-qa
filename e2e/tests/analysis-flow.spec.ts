import { expect, test } from '@playwright/test'
import { AnalysisPage } from './pages/analysis.page'
import { AnomaliesPage } from './pages/anomalies.page'

test('ejecuta el análisis y valida sus anomalías', async ({ page }) => {
  await page.goto('/')

  const analysisPage = new AnalysisPage(page)
  const newAnalysisId = await analysisPage.runAndWaitForCompletion()

  // Validación opcional API: el último análisis debe ser el mismo que mostró la UI.
  const token = await page.evaluate(() => localStorage.getItem('energyai.token'))
  expect(token, 'La sesión debe guardar el token de autenticación').toBeTruthy()

  const latestResponse = await page.request.get('/api/v1/ai/analysis/latest', {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(latestResponse.ok()).toBeTruthy()

  const latest = (await latestResponse.json()) as {
    id: string
    status: string
    summary: { anomalies_detected: number; requiring_attention: number }
  }
  expect(latest.id).toBe(newAnalysisId)
  expect(latest.status).toBe('COMPLETED')
  expect(latest.summary).toMatchObject({
    anomalies_detected: 4,
    requiring_attention: 2,
  })

  await analysisPage.openAnomalies()
  await new AnomaliesPage(page).validateExpectedResults()
})
