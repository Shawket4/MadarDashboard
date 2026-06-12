import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { useScopeStore } from '@/shared/scope/scope-store'
import Analytics from '../analytics'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { 
  getListBranchesMockHandler,
  getBranchSalesMockHandler,
  getBranchSalesTimeseriesMockHandler,
  getBranchAddonSalesMockHandler,
  getBranchStockMockHandler,
  getBranchTellerStatsMockHandler,
  getOrgBranchComparisonMockHandler
} from '@/shared/api/generated/api.msw'

vi.mock('@/shared/lib/excel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/excel')>()
  return {
    ...actual,
    exportToExcel: vi.fn(),
  }
})

vi.mock('recharts', async (importOriginal) => {
  const OriginalRechartsModule = await importOriginal<typeof import('recharts')>()
  return {
    ...OriginalRechartsModule,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: '800px', height: '600px' }}>
        {children}
      </div>
    ),
  }
})

const MOCK_BRANCHES = [
  { id: '1', name: 'Downtown Branch', phone: '12345678', address: '123 Main St', timezone: 'Africa/Cairo', is_active: true, printer_brand: 'star', printer_ip: '192.168.1.100', printer_port: 9100 },
  { id: '2', name: 'Uptown Branch', phone: '12345678', address: '123 Main St', timezone: 'Africa/Cairo', is_active: true, printer_brand: 'star', printer_ip: '192.168.1.101', printer_port: 9100 },
]

const MOCK_SALES = {
  branch_id: '1',
  branch_name: 'Downtown Branch',
  total_revenue: 1500000,
  total_orders: 150,
  subtotal: 1300000,
  total_discount: 100000,
  total_tax: 300000,
  voided_orders: 5,
  revenue_by_method: {
    cash: 500000,
    card: 500000,
    digital_wallet: 200000,
    talabat_online: 150000,
    talabat_cash: 150000,
  },
  top_items: [
    { menu_item_id: 'i1', item_name: 'Latte', item_name_translations: {}, quantity_sold: 50, revenue: 500000 }
  ],
  by_category: [
    { category_id: 'c1', category_name: 'Coffee', category_name_translations: {}, quantity_sold: 50, revenue: 500000, item_count: 1, items: [] }
  ]
}

const MOCK_TIMESERIES = [
  { period: '2026-05-24T10:00:00Z', revenue: 50000, orders: 5, voided: 0, revenue_by_method: { cash: 50000, card: 0, digital_wallet: 0, talabat_online: 0, talabat_cash: 0 }, discount: 0, tax: 0 }
]

const MOCK_ADDON_SALES = [
  { addon_item_id: 'a1', addon_name: 'Extra Shot', addon_name_translations: {}, addon_type: 'milk', quantity_sold: 20, revenue: 100000 }
]

const MOCK_STOCK = {
  branch_id: '1',
  branch_name: 'Downtown Branch',
  items: [
    { branch_inventory_id: 's1', org_ingredient_id: 'ing1', ingredient_name: 'Milk', unit: 'ml', current_stock: 5000, reorder_threshold: 1000, below_reorder: false, cost_per_unit: 10 }
  ]
}

const MOCK_TELLER_STATS = [
  { teller_id: 'u1', teller_name: 'Admin', orders: 100, voided: 2, shifts: 5, avg_order_value: 10000, revenue: 1000000 }
]

const MOCK_ORG_COMPARISON = {
  org_id: 'org1',
  branches: [
    { branch_id: '1', branch_name: 'Downtown Branch', total_orders: 100, voided_orders: 2, avg_order_value: 10000, revenue_by_method: { cash: 500000, card: 500000, digital_wallet: 0, talabat_online: 0, talabat_cash: 0 }, total_revenue: 1000000, void_rate_pct: 2 }
  ]
}

describe('Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // pages now read branch scope from the global scope store (B.1)
    useScopeStore.setState({ branchId: '1' })
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
      getBranchSalesMockHandler(MOCK_SALES),
      getBranchSalesTimeseriesMockHandler(MOCK_TIMESERIES),
      getBranchAddonSalesMockHandler(MOCK_ADDON_SALES),
      getBranchStockMockHandler(MOCK_STOCK),
      getBranchTellerStatsMockHandler(MOCK_TELLER_STATS),
      getOrgBranchComparisonMockHandler(MOCK_ORG_COMPARISON)
    )
  })

  it('renders overview tab with stats', async () => {
    render(<Analytics />)
    
    await waitFor(() => {
      expect(screen.getByText('Latte')).toBeInTheDocument()
    })
  })

  it('switches to revenue tab', async () => {
    const user = userEvent.setup()
    render(<Analytics />)
    
    const revenueTab = screen.getByRole('tab', { name: /analytics.tabs.revenue/i })
    await user.click(revenueTab)

    await waitFor(() => {
      expect(screen.getByText('analytics.revenueOverTime')).toBeInTheDocument()
    })
  })

  it('switches to items tab', async () => {
    const user = userEvent.setup()
    render(<Analytics />)
    
    const itemsTab = screen.getByRole('tab', { name: /analytics.tabs.items/i })
    await user.click(itemsTab)

    await waitFor(() => {
      expect(screen.getByText('analytics.topItemsRev')).toBeInTheDocument()
      expect(screen.getByText('Extra Shot')).toBeInTheDocument()
    })
  })

  it('switches to tellers tab', async () => {
    const user = userEvent.setup()
    render(<Analytics />)
    
    const tellersTab = screen.getByRole('tab', { name: /analytics.tabs.tellers/i })
    await user.click(tellersTab)

    await waitFor(() => {
      expect(screen.getByText('analytics.revenueByTeller')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  it('switches to branches tab', async () => {
    const user = userEvent.setup()
    render(<Analytics />)
    
    const branchesTab = await screen.findByRole('tab', { name: /analytics.tabs.branches/i })
    await user.click(branchesTab)

    await waitFor(() => {
      expect(screen.getByText('analytics.revenueByBranch')).toBeInTheDocument()
      expect(screen.getAllByText('Downtown Branch')[0]).toBeInTheDocument()
    })
  })

  it('switches to inventory tab', async () => {
    const user = userEvent.setup()
    render(<Analytics />)
    
    const inventoryTab = screen.getByRole('tab', { name: /analytics.tabs.inventory/i })
    await user.click(inventoryTab)

    await waitFor(() => {
      expect(screen.getByText('analytics.stockLevels')).toBeInTheDocument()
      expect(screen.getByText('Milk')).toBeInTheDocument()
    })
  })
})
