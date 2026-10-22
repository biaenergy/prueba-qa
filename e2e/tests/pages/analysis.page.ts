import { expect, type Locator, type Page } from '@playwright/test'

const ANALYSIS_ID = /AN-\d{4,}/

export class AnalysisPage {
  private readonly lastAnalysis: Locator

  constructor(private readonly page: Page) {
    this.lastAnalysis = page
      .getByRole('banner')
      .getByText('Último análisis', { exact: true })
      .locator('..')
  }

  async currentAnalysisId(): Promise<string> {
    await expect(this.lastAnalysis).toBeVisible()
    const text = await this.lastAnalysis.innerText()
    const id = text.match(ANALYSIS_ID)?.[0]
    if (!id) throw new Error(`No se encontró el ID del último análisis en: ${text}`)
    return id
  }

  async runAndWaitForCompletion(): Promise<string> {
    const previousId = await this.currentAnalysisId()

    await this.page.getByRole('button', { name: 'Run AI Analysis' }).click()

    const panel = this.page.getByRole('region', { name: 'Análisis de IA' })
    await expect(panel).toBeVisible()

    const idLabel = panel.getByText(ANALYSIS_ID)
    await expect(idLabel).toBeVisible()
    const newId = (await idLabel.innerText()).match(ANALYSIS_ID)?.[0]

    expect(newId, 'El nuevo análisis debe mostrar un ID').toBeTruthy()
    expect(newId, 'El ID debe cambiar después de ejecutar el análisis').not.toBe(previousId)

    await expect(panel.getByRole('status')).toContainText('4 anomalías · 2 prioritarias')
    await expect(panel.getByText('Hecho', { exact: true })).toHaveCount(7)
    await expect(this.lastAnalysis).toContainText(`${newId} · completado`)

    return newId as string
  }

  async openAnomalies() {
    await this.page.getByRole('link', { name: 'Ver órdenes' }).click()
    await expect(this.page).toHaveURL('/anomalias')
  }
}
