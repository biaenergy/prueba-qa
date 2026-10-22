import { expect, type Page } from '@playwright/test'
import { expectedAnomalies } from '../data/expected-results'

export class AnomaliesPage {
  constructor(private readonly page: Page) {}

  async validateExpectedResults() {
    await expect(this.page.getByRole('heading', { name: 'Anomalías IA' })).toBeVisible()
    await expect(this.page.getByText('4 anomalías detectadas · 2 requieren atención prioritaria.', { exact: false })).toBeVisible()

    const table = this.page.getByRole('table', {
      name: 'Anomalías detectadas por la IA, ordenadas por prioridad',
    })
    await expect(table.getByRole('row')).toHaveCount(5)

    for (const expected of expectedAnomalies) {
      const row = table.getByRole('row').filter({
        has: this.page.getByRole('link', { name: expected.meterId, exact: true }),
      })

      await expect(row).toContainText(expected.priority)
      await expect(row).toContainText(expected.type)
      await expect(row).toContainText(expected.severity)
      await expect(row).toContainText(expected.action)
    }

    const meterOrder = await table.getByRole('row').getByRole('link').allTextContents()
    expect(meterOrder).toEqual(expectedAnomalies.map((item) => item.meterId))
  }
}
