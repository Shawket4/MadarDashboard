import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import Recipes from '../recipes'
import { toast } from 'sonner'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { 
  getListMenuItemsMockHandler, 
  getGetMenuItemMockHandler,
  getListAddonItemsMockHandler,
  getListAddonIngredientsMockHandler,
  getDeleteDrinkRecipeMockHandler
} from '@/shared/api/generated/api.msw'

vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const MOCK_ITEMS = [
  {
    id: 'item-1',
    org_id: 'org-1',
    name: 'Latte',
    description: 'Hot latte',
    is_active: true,
  }
] as any[]

const MOCK_FULL_ITEM = {
  id: 'item-1',
  org_id: 'org-1',
  name: 'Latte',
  sizes: [
    { id: 'sz-1', label: 'Regular' }
  ],
  recipes: [
    {
      size_label: 'Regular',
      ingredient_name: 'Milk',
      quantity_used: 200,
      ingredient_unit: 'ml',
      category: 'Dairy'
    }
  ]
} as any

const MOCK_ADDONS = [
  {
    id: 'addon-1',
    org_id: 'org-1',
    name: 'Almond Milk',
    addon_type: 'milk',
  }
] as any[]

const MOCK_ADDON_RECIPES = [
  {
    id: 'r-1',
    addon_item_id: 'addon-1',
    ingredient_name: 'Almond Milk Extract',
    unit: 'ml',
    quantity_used: 100
  }
] as any[]

describe('Recipes Page', () => {
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
      getListMenuItemsMockHandler(MOCK_ITEMS),
      getGetMenuItemMockHandler(MOCK_FULL_ITEM),
      getListAddonItemsMockHandler(MOCK_ADDONS),
      getListAddonIngredientsMockHandler(MOCK_ADDON_RECIPES)
    )
  })

  it('renders recipe components correctly', async () => {
    render(<Recipes />)
    
    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })
    
    // By default it should show Drinks tab
    expect(screen.getByText('recipes.tabs.drinks')).toBeInTheDocument()
  })

  it('selects a drink and shows its ingredients', async () => {
    const user = userEvent.setup()
    render(<Recipes />)
    
    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })

    const latteItem = screen.getByText('Latte')
    await user.click(latteItem)

    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument()
    })
  })

  it('switches to addons tab and shows addon ingredients', async () => {
    const user = userEvent.setup()
    render(<Recipes />)
    
    const addonsTab = screen.getByRole('tab', { name: /recipes.tabs.addons/i })
    await user.click(addonsTab)

    await waitFor(() => {
      expect(screen.getByText('Almond Milk')).toBeInTheDocument()
    })

    const almondItem = screen.getByText('Almond Milk')
    await user.click(almondItem)

    await waitFor(() => {
      expect(screen.getByText('Almond Milk Extract')).toBeInTheDocument()
    })
  })

  it('handles drink recipe deletion via the builder save flow', async () => {
    const user = userEvent.setup()
    render(<Recipes />)
    
    server.use(
      getDeleteDrinkRecipeMockHandler()
    )

    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Latte'))

    await waitFor(() => {
      expect(screen.getByText('Milk')).toBeInTheDocument()
    })

    // remove the line in the builder, then commit with Save
    const deleteBtns = screen.getAllByRole('button').filter(b => b.className.includes('text-destructive'))
    await user.click(deleteBtns[0])

    const saveBtn = screen.getByRole('button', { name: /recipes.builder.saveAll/i })
    await user.click(saveBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('recipes.builder.saved')
    })
  })
})
