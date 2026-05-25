import { setupServer } from 'msw/node'
import { getSufrixAPIMock } from '@/shared/api/generated/api.msw'

// This configures a request mocking server with the given request handlers.
// You can pass default handlers here if you have any.
export const server = setupServer(...getSufrixAPIMock())
