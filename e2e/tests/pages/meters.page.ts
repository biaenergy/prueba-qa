import { expect, type Page } from '@playwright/test'

export class MetersPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/medidores')
    await expect(this.page.getByRole('heading', { name: 'Libro de medidores' })).toBeVisible()
  }

  async validateSecondPageIsAvailable() {
    const pagination = this.page.getByRole('navigation', { name: 'Paginación' })
    await expect(pagination).toContainText('1–10 de 12 medidores')
    await expect(pagination.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  }
}
