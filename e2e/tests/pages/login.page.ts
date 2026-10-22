import { expect, type Page } from '@playwright/test'

export class LoginPage {
  constructor(private readonly page: Page) {}

  async open() {
    await this.page.goto('/login')
    await expect(this.page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
  }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email)
    await this.page.getByLabel('Contraseña').fill(password)
    await this.page.getByRole('button', { name: 'Entrar' }).click()
    await expect(this.page).toHaveURL('/')
    await expect(this.page.getByRole('button', { name: 'Run AI Analysis' })).toBeVisible()
  }
}
