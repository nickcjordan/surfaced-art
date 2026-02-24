import { setupServer } from 'msw/node'

/**
 * MSW server instance for mocking external API calls in integration tests.
 * Handlers will be added by later test issues as external integrations
 * are built (Stripe, Shippo, Mux, Cognito, SES).
 *
 * Usage in test files:
 *   import { mswServer } from '../test-helpers/msw-setup'
 *   beforeAll(() => mswServer.listen())
 *   afterEach(() => mswServer.resetHandlers())
 *   afterAll(() => mswServer.close())
 */
export const mswServer = setupServer()
