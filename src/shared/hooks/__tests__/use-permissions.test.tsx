import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { server } from '@/test/mocks/server'
import { usePermissions } from '../use-permissions'
import * as useCurrentContextMock from '../use-current-context'
import { getGetMyPermissionsMockHandler } from '@/shared/api/generated/api.msw'
describe('usePermissions Hook', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    vi.clearAllMocks()
    server.resetHandlers()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  it('super_admin can do anything regardless of API', async () => {
    vi.spyOn(useCurrentContextMock, 'useCurrentContext').mockReturnValue({
      user: { id: '1', role: 'super_admin' },
    } as any)

    const { result } = renderHook(() => usePermissions(), { wrapper })

    expect(result.current.can('fake_resource', 'destroy_world')).toBe(true)
  })

  it('org_admin defaults are applied before API responds', async () => {
    vi.spyOn(useCurrentContextMock, 'useCurrentContext').mockReturnValue({
      user: { id: '1', role: 'org_admin' },
    } as any)

    server.use(
      getGetMyPermissionsMockHandler(async () => {
        // Delay response to test initial loading state
        await new Promise(resolve => setTimeout(resolve, 100))
        return { permissions: [] }
      })
    )

    const { result } = renderHook(() => usePermissions(), { wrapper })

    // Before API resolves, org_admin can create branches but cannot destroy_world
    expect(result.current.can('branches', 'create')).toBe(true)
    expect(result.current.can('fake_resource', 'destroy_world')).toBe(false)
  })

  it('API permissions override local defaults when fetched', async () => {
    vi.spyOn(useCurrentContextMock, 'useCurrentContext').mockReturnValue({
      user: { id: '1', role: 'teller' },
    } as any)

    server.use(
      getGetMyPermissionsMockHandler({
        permissions: [
          { resource: 'menu_items', action: 'create', granted: true }
        ]
      } as any)
    )

    const { result } = renderHook(() => usePermissions(), { wrapper })

    // By default, a teller CANNOT create menu items.
    expect(result.current.can('menu_items', 'create')).toBe(false)

    // Wait for the query to finish and hydrate the lookup map
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Now the teller CAN create menu items because the API granted it
    expect(result.current.can('menu_items', 'create')).toBe(true)
  })
})
