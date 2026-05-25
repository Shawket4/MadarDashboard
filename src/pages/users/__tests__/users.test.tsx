import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import Users from '../users'
import { toast } from 'sonner'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { getListUsersMockHandler, getCreateUserMockHandler, getDeleteUserMockHandler } from '@/shared/api/generated/api.msw'

vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const MOCK_USERS = [
  {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@sufrix.com',
    phone: '1234567890',
    role: 'super_admin',
    is_active: true,
    org_id: 'org-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'u-2',
    name: 'Teller User',
    email: 'teller@sufrix.com',
    phone: '0987654321',
    role: 'teller',
    is_active: true,
    org_id: 'org-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
] as any[]

describe('Users Page', () => {
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
      http.get('*/orgs', () => HttpResponse.json([{ id: 'org-1', name: 'Org 1' }])),
      http.get('*/branches', () => HttpResponse.json([{ id: 'b-1', name: 'Branch 1' }])),
      http.get('*/users/*/branches', () => HttpResponse.json([]))
    )
  })

  it('renders users list correctly', async () => {
    render(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
      expect(screen.getByText('Teller User')).toBeInTheDocument()
    })
    
    expect(screen.getByText('admin@sufrix.com')).toBeInTheDocument()
    expect(screen.getByText('teller@sufrix.com')).toBeInTheDocument()
  })

  it('opens and closes create user dialog', async () => {
    const user = userEvent.setup()
    render(<Users />)
    
    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    const newBtn = screen.getByRole('button', { name: /common.new/i })
    await user.click(newBtn)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('users.newTitle')).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /common.cancel/i })
    await user.click(cancelBtn)
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('handles user creation', async () => {
    const user = userEvent.setup()
    render(<Users />)
    
    server.use(
      getCreateUserMockHandler(() => {
        return { id: 'u-3' } as any
      })
    )

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /common.new/i }))
    
    const nameInput = screen.getByLabelText(/users.fullName/i)
    await user.type(nameInput, 'New User')

    const roleSelect = screen.getByRole('combobox', { name: /users.role/i })
    await user.click(roleSelect)
    const roleOption = await screen.findByRole('option', { name: /roles.teller/i })
    await user.click(roleOption)

    const orgSelect = screen.getByRole('combobox', { name: /users.org/i })
    await user.click(orgSelect)
    const orgOption = await screen.findByRole('option', { name: 'Org 1' })
    await user.click(orgOption)

    const saveBtn = screen.getByRole('button', { name: /common.create/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('users.createdToast')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('handles user deletion via confirm dialog', async () => {
    const user = userEvent.setup()
    render(<Users />)
    
    server.use(
      getDeleteUserMockHandler()
    )

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument()
    })

    const deleteBtns = screen.getAllByRole('button').filter(b => b.className.includes('text-destructive'))
    await user.click(deleteBtns[0])

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /common.confirm/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('users.deletedToast')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
