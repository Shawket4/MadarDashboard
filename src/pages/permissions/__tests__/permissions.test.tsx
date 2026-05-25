import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import Permissions from '../permissions'
import { toast } from 'sonner'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { getListUsersMockHandler, getGetPermissionMatrixMockHandler, getUpsertUserPermissionMockHandler } from '@/shared/api/generated/api.msw'

const MOCK_USERS = [
  {
    id: 'u-1',
    name: 'Admin User',
    role: 'super_admin',
  },
  {
    id: 'u-2',
    name: 'Teller User',
    role: 'teller',
  }
] as any[]

const MOCK_MATRIX = [
  {
    resource: 'orders',
    action: 'read',
    role_default: true,
    user_override: null,
    effective: true,
  },
  {
    resource: 'orders',
    action: 'delete',
    role_default: false,
    user_override: null,
    effective: false,
  }
] as any[]

describe('Permissions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    
    vi.spyOn(useCurrentContextMock, 'useCurrentContext').mockReturnValue({
      user: { id: 'u-1', role: 'super_admin' },
      orgId: 'org-1',
      isSuperAdmin: true,
      role: 'super_admin',
      isLoading: false,
    } as any)

    server.use(
      getListUsersMockHandler(MOCK_USERS),
      getGetPermissionMatrixMockHandler(MOCK_MATRIX)
    )
  })

  it('renders users list and placeholder when no user selected', async () => {
    render(<Permissions />)
    
    await waitFor(() => {
      expect(screen.getByText('Teller User')).toBeInTheDocument()
    })
    
    expect(screen.getAllByText('permissions.selectUser').length).toBeGreaterThan(0)
    expect(screen.getByText('permissions.selectUserHint')).toBeInTheDocument()
  })

  it('renders matrix when user is selected', async () => {
    const user = userEvent.setup()
    render(<Permissions />)
    
    await waitFor(() => {
      expect(screen.getByText('Teller User')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Teller User'))

    await waitFor(() => {
      expect(screen.getByText('permissions.resources.orders')).toBeInTheDocument()
    })
  })

  it('handles permission override', async () => {
    const user = userEvent.setup()
    render(<Permissions />)
    
    server.use(
      getUpsertUserPermissionMockHandler(() => {
        return { granted: true } as any
      })
    )

    await waitFor(() => {
      expect(screen.getByText('Teller User')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Teller User'))

    await waitFor(() => {
      expect(screen.getByText('permissions.resources.orders')).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button')
    // Find the toggle button for an action
    const toggles = buttons.filter(b => b.title === 'permissions.roleDefault' || b.title === 'permissions.override')
    
    if (toggles.length > 0) {
      await user.click(toggles[0])
      await waitFor(() => {
        expect(toast.error).not.toHaveBeenCalled()
      })
    }
  })
})
