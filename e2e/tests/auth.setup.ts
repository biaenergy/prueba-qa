import { test as setup } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { credentials } from './data/expected-results'
import { LoginPage } from './pages/login.page'

const authFile = path.join(process.cwd(), '.auth/user.json')

setup('iniciar sesión una sola vez', async ({ page }) => {
  const loginPage = new LoginPage(page)

  await loginPage.open()
  await loginPage.login(credentials.email, credentials.password)

  fs.mkdirSync(path.dirname(authFile), { recursive: true })
  await page.context().storageState({ path: authFile })
})
