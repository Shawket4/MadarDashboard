import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import Inventory from '../inventory'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { 
  getListBranchesMockHandler,
  getListCatalogMockHandler,
  getListBranchStockMockHandler,
  getListAdjustmentsMockHandler,
  getListTransfersMockHandler
} from '@/shared/api/generated/api.msw'

vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const MOCK_BRANCHES = [
  { id: '1', name: 'Downtown Branch', phone: '12345678', address: '123 Main St', timezone: 'Africa/Cairo', is_active: true, printer_brand: 'star', printer_ip: '192.168.1.100', printer_port: 9100 },
]

const MOCK_CATALOG = [
  {
    id: 'ing-1',
    org_id: 'org-1',
    name: 'Coffee Beans',
    unit: 'kg',
    category: 'coffee_bean',
    cost_per_unit: 500,
    is_active: true
  }
] as any[]

const MOCK_STOCK = [
  {
    id: 'stock-1',
    branch_id: '1',
    org_ingredient_id: 'ing-1',
    ingredient_name: 'Coffee Beans',
    unit: 'kg',
    current_stock: 10.5,
    reorder_threshold: 2.0,
    below_reorder: false
  }
] as any[]

const MOCK_ADJUSTMENTS = [
  {
    id: 'adj-1',
    branch_inventory_id: 'stock-1',
    branch_id: '1',
    ingredient_name: 'Coffee Beans',
    unit: 'kg',
    adjustment_type: 'add',
    quantity: 5.0,
    note: 'Delivery',
    adjusted_by: 'u-1',
    adjusted_by_name: 'Admin',
    created_at: new Date().toISOString()
  }
] as any[]

const MOCK_TRANSFERS = [
  {
    id: 'tr-1',
    source_branch_id: '1',
    source_branch_name: 'Downtown Branch',
    destination_branch_id: '2',
    destination_branch_name: 'Uptown Branch',
    org_ingredient_id: 'ing-1',
    ingredient_name: 'Coffee Beans',
    unit: 'kg',
    quantity: 2.0,
    note: 'Stock transfer',
    initiated_by: 'u-1',
    initiated_by_name: 'Admin',
    initiated_at: new Date().toISOString()
  }
] as any[]

describe('Inventory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    
    vi.spyOn(useCurrentContextMock, 'useCurrentContext').mockReturnValue({
      user: { id: 'u-1', name: 'Admin', email: 'admin@test.com', role: 'super_admin' },
      role: 'super_admin',
      orgId: 'org-1',
      branchId: '1',
      isSuperAdmin: true,
      hasPermission: () => true,
    } as any)

    server.use(
      getListBranchesMockHandler(MOCK_BRANCHES as any),
      getListCatalogMockHandler(MOCK_CATALOG),
      getListBranchStockMockHandler(MOCK_STOCK),
      getListAdjustmentsMockHandler(MOCK_ADJUSTMENTS),
      getListTransfersMockHandler(MOCK_TRANSFERS)
    )
  })

  it('renders catalog components correctly', async () => {
    render(<Inventory />)
    
    await waitFor(() => {
      expect(screen.getByText('Coffee Beans')).toBeInTheDocument()
    })
  })

  it('switches to stock tab and renders stock items', async () => {
    const user = userEvent.setup()
    render(<Inventory />)
    
    const stockTab = screen.getByRole('tab', { name: /inventory.tabs.stock/i })
    await user.click(stockTab)

    await waitFor(() => {
      expect(screen.getByText('10.500')).toBeInTheDocument()
    })
  })

  it('switches to adjustments tab and renders adjustments', async () => {
    const user = userEvent.setup()
    render(<Inventory />)
    
    const adjTab = screen.getByRole('tab', { name: /inventory.tabs.adjustments/i })
    await user.click(adjTab)

    await waitFor(() => {
      expect(screen.getByText('Delivery')).toBeInTheDocument()
    })
  })

  it('switches to transfers tab and renders transfers', async () => {
    const user = userEvent.setup()
    render(<Inventory />)
    
    const trTab = screen.getByRole('tab', { name: /inventory.tabs.transfers/i })
    await user.click(trTab)

    await waitFor(() => {
      expect(screen.getByText('Stock transfer')).toBeInTheDocument()
    })
  })
})
