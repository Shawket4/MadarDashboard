import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import Menu from '../menu'
import { toast } from 'sonner'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { 
  getListCategoriesMockHandler, 
  getListMenuItemsMockHandler, 
  getListAddonItemsMockHandler,
  getDeleteCategoryMockHandler
} from '@/shared/api/generated/api.msw'

vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const MOCK_CATEGORIES = [
  {
    id: 'cat-1',
    org_id: 'org-1',
    name: 'Coffee',
    image_url: null,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
] as any[]

const MOCK_ITEMS = [
  {
    id: 'item-1',
    org_id: 'org-1',
    category_id: 'cat-1',
    name: 'Latte',
    description: 'Hot latte',
    image_url: null,
    base_price: 1500,
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sizes: []
  }
] as any[]

const MOCK_ADDONS = [
  {
    id: 'addon-1',
    org_id: 'org-1',
    name: 'Almond Milk',
    addon_type: 'milk',
    default_price: 500,
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
] as any[]

describe('Menu Page', () => {
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
      getListCategoriesMockHandler(MOCK_CATEGORIES),
      getListMenuItemsMockHandler(MOCK_ITEMS),
      getListAddonItemsMockHandler(MOCK_ADDONS)
    )
  })

  it('renders menu items correctly', async () => {
    render(<Menu />)
    
    // By default, it's on Menu Items tab
    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Coffee')).toBeInTheDocument()
  })

  it('switches to categories tab', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    
    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })

    const catsTab = screen.getByRole('tab', { name: /menu.categoriesCount/i })
    await user.click(catsTab)
    
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })
  })



  it('handles category deletion', async () => {
    const user = userEvent.setup()
    render(<Menu />)
    
    server.use(
      getDeleteCategoryMockHandler()
    )

    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })

    const catsTab = screen.getByRole('tab', { name: /menu.categoriesCount/i })
    await user.click(catsTab)

    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })

    const deleteBtns = screen.getAllByRole('button').filter(b => b.className.includes('text-destructive'))
    await user.click(deleteBtns[0])

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: /common.confirm/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('common.delete')
    })
  })
})
