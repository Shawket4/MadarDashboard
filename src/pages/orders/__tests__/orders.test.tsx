import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { useScopeStore } from '@/shared/scope/scope-store'
import Orders from '../orders'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import {
  getListOrdersMockHandler,
  getGetOrderMockHandler,
  getVoidOrderMockHandler,
  getListBranchesMockHandler,
  getListShiftsMockHandler,
} from '@/shared/api/generated/api.msw'

const mockBranches = [
  { id: '1', name: 'Downtown Branch', phone: '12345678', address: '123 Main St', timezone: 'Africa/Cairo', is_active: true, printer_brand: 'star', printer_ip: '192.168.1.100', printer_port: 9100 },
]

const mockShifts = [
  { id: 'shift1', branch_id: '1', teller_id: 'u1', teller_name: 'Admin', opened_at: '2026-05-24T10:00:00Z', status: 'open', opening_cash: 500, total_revenue: 0 },
]

const mockOrders = {
  data: [
    {
      id: 'order1',
      order_number: 1001,
      created_at: '2026-05-24T10:30:00Z',
      teller_name: 'Admin',
      customer_name: 'John Doe',
      payment_method: 'card',
      total_amount: 15000, // 150.00
      status: 'completed',
    },
    {
      id: 'order2',
      order_number: 1002,
      created_at: '2026-05-24T11:00:00Z',
      teller_name: 'Admin',
      customer_name: null,
      payment_method: 'cash',
      total_amount: 5000,
      status: 'voided',
    }
  ],
  total: 2,
  page: 1,
  per_page: 25,
  total_pages: 1,
  summary: { revenue: 15000, completed: 1, voided: 1, discounts: 0, tips: 0 }
}

const mockOrderDetail = {
  ...mockOrders.data[0],
  subtotal: 15000,
  discount_amount: 0,
  tax_amount: 0,
  tip_amount: 0,
  amount_tendered: null,
  change_given: null,
  items: [
    {
      id: 'item1',
      item_name: 'Burger',
      quantity: 1,
      unit_price: 15000,
      line_total: 15000,
      addons: [],
      optionals: [],
    }
  ]
}

describe('Orders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // pages now read branch scope from the global scope store (B.1)
    useScopeStore.setState({ branchId: '1' })
    queryClient.clear()

    vi.spyOn(useCurrentContextMock, 'useCurrentContext').mockReturnValue({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'super_admin' },
      role: 'super_admin',
      orgId: 'org1',
      branchId: '1',
      isSuperAdmin: true,
      hasPermission: () => true,
    } as any)
    
    server.use(
      getListBranchesMockHandler(mockBranches as any),
      getListShiftsMockHandler(mockShifts as any),
      getListOrdersMockHandler(mockOrders as any),
      getGetOrderMockHandler(mockOrderDetail as any),
      getVoidOrderMockHandler({} as any)
    )
  })

  it('renders list of orders and stats', async () => {
    render(<Orders />)

    // Wait for the stats to load
    await waitFor(() => {
      expect(screen.getAllByText(/150\.00/)[0]).toBeInTheDocument() // Revenue
      expect(screen.getByText(/1001/)).toBeInTheDocument() // Order number
      expect(screen.getByText(/John Doe/)).toBeInTheDocument() // Customer
    })
    
    // Check that voided order shows up
    expect(screen.getByText(/1002/)).toBeInTheDocument()
  })

  it('opens order detail and voids an order', async () => {
    const user = userEvent.setup()
    render(<Orders />)

    await waitFor(() => {
      expect(screen.getByText(/1001/)).toBeInTheDocument()
    })

    // Click on the order to view details
    const orderRow = screen.getByText(/1001/)
    await user.click(orderRow)

    // Wait for the details drawer to open and fetch the order
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /orders\.voidOrder/i })).toBeInTheDocument()
    })
    
    // Click the void button in the drawer header
    const voidBtn = screen.getByRole('button', { name: /orders\.voidOrder/i })
    await user.click(voidBtn)

    // Dialog appears
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/orders\.voidConfirm/i)).toBeInTheDocument()
    })

    // Submit void (the button in dialog)
    // The dialog has a submit button with the text "orders.voidOrder"
    const dialog = screen.getByRole('dialog')
    // We can find the button inside dialog
    const confirmVoidBtn = dialog.querySelector('button[type="submit"]')!
    await user.click(confirmVoidBtn)

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
