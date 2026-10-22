import { test } from '@playwright/test'
import { MetersPage } from './pages/meters.page'

test('BUG-01 permite acceder a los 12 medidores mediante la paginación', async ({ page }) => {
  test.fail(true, 'BUG-01: con 12 registros y páginas de 10, el botón Siguiente aparece deshabilitado')

  const metersPage = new MetersPage(page)
  await metersPage.open()
  await metersPage.validateSecondPageIsAvailable()
})
