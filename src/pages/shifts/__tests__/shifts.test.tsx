import { render, screen, waitFor, queryClient } from '@/test/utils'

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { server } from '@/test/mocks/server'
import { useScopeStore } from '@/shared/scope/scope-store'
import Shifts from '../shifts'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import {
  getListBranchesMockHandler,
  getListShiftsMockHandler,
  getGetCurrentShiftMockHandler,
  getOpenShiftMockHandler,
  getCloseShiftMockHandler,
} from '@/shared/api/generated/api.msw'

const mockBranches = [
  { id: '1', name: 'Downtown Branch', phone: '12345678', address: '123 Main St', timezone: 'Africa/Cairo', is_active: true, printer_brand: 'star', printer_ip: '192.168.1.100', printer_port: 9100 },
]

const mockShifts = [
  { 
    id: 'shift1', 
    branch_id: '1', 
    teller_id: 'u1', 
    teller_name: 'Admin', 
    opened_at: '2026-05-24T10:00:00Z', 
    status: 'open', 
    opening_cash: 50000, 
  },
]

describe('Shifts Page', () => {
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
      getGetCurrentShiftMockHandler({ 
        has_open_shift: true,
        open_shift: mockShifts[0], 
        suggested_opening_cash: 50000 
      } as any),
      getOpenShiftMockHandler(mockShifts[0] as any),
      getCloseShiftMockHandler({} as any)
    )
  })

  it('renders list of shifts', async () => {
    render(<Shifts />)

    // Wait for the shifts to load
    await waitFor(() => {
      // It should display the current shift card
      expect(screen.getByText(/shifts\.shiftIsOpen/)).toBeInTheDocument()
      
      // And the list of shifts
      expect(screen.getAllByText(/Admin/)[0]).toBeInTheDocument()
    })
  })
})
