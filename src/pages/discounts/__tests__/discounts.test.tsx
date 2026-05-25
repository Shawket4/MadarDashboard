import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import Discounts from '../discounts'
import { toast } from 'sonner'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { 
  getListDiscountsMockHandler,
  getDeleteDiscountMockHandler
} from '@/shared/api/generated/api.msw'

vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const MOCK_DISCOUNTS = [
  {
    id: 'disc-1',
    org_id: 'org-1',
    name: '10% Off',
    dtype: 'percentage',
    value: 10,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'disc-2',
    org_id: 'org-1',
    name: '5 EGP Off',
    dtype: 'fixed',
    value: 500, // 5 EGP
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
] as any[]

describe('Discounts Page', () => {
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
      getListDiscountsMockHandler(MOCK_DISCOUNTS)
    )
  })

  it('renders discounts correctly', async () => {
    render(<Discounts />)
    
    await waitFor(() => {
      expect(screen.getByText('10% Off')).toBeInTheDocument()
    })
    
    expect(screen.getByText('5 EGP Off')).toBeInTheDocument()
  })

  it('handles discount deletion', async () => {
    const user = userEvent.setup()
    render(<Discounts />)
    
    server.use(
      getDeleteDiscountMockHandler()
    )

    await waitFor(() => {
      expect(screen.getByText('10% Off')).toBeInTheDocument()
    })

    const deleteBtns = screen.getAllByRole('button').filter(b => b.className.includes('text-destructive'))
    await user.click(deleteBtns[0])

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /common.confirm/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('discounts.deletedToast')
    })
  })
})
