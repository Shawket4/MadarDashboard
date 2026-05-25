import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import Branches from '../branches'
import { toast } from 'sonner'
import * as useCurrentContextMock from '@/shared/hooks/use-current-context'
import { getListBranchesMockHandler, getCreateBranchMockHandler, getUpdateBranchMockHandler, getDeleteBranchMockHandler } from '@/shared/api/generated/api.msw'

// Mock exportToExcel to avoid actual file saving during tests
vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const mockBranches = [
  { id: '1', name: 'Downtown Branch', phone: '12345678', address: '123 Main St', timezone: 'Africa/Cairo', is_active: true, printer_brand: 'star', printer_ip: '192.168.1.100', printer_port: 9100 },
  { id: '2', name: 'Mall Branch', phone: null, address: null, timezone: 'Africa/Cairo', is_active: false, printer_brand: null, printer_ip: null, printer_port: null },
]

describe('Branches Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      getListBranchesMockHandler(mockBranches as any)
    )
  })

  it('renders list of branches and stats', async () => {
    render(<Branches />)
    
    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument()
      expect(screen.getByText('Mall Branch')).toBeInTheDocument()
    })

    // Check stats (Total 2, Active 1, Inactive 1, With Printer 1)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0) // Total
    expect(screen.getAllByText('1').length).toBeGreaterThan(0) // Active/Inactive/Printer
  })

  it('handles API errors gracefully', async () => {
    server.use(
      http.get('*/branches', () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    render(<Branches />)
    
    await waitFor(() => {
      expect(screen.getByText('common.noResults')).toBeInTheDocument()
    })
  })

  it('opens new branch dialog, handles validation, and creates branch', async () => {
    const user = userEvent.setup()
    render(<Branches />)

    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /common.new/i }))
    expect(screen.getByText('branches.newTitle')).toBeInTheDocument()
    
    // Submit empty form (should block on name required)
    await user.click(screen.getByRole('button', { name: /common.create/i }))
    await waitFor(() => {
      expect(screen.getAllByText(/String must contain|Required|invalid/i).length).toBeGreaterThan(0)
    })

    let createBody: any = null
    server.use(
      getCreateBranchMockHandler(async (info) => {
        createBody = await info.request.clone().json()
        return { id: '3', ...createBody } as any
      })
    )

    // Type valid data
    const nameInput = screen.getByLabelText('branches.branchName')
    await user.type(nameInput, 'New Uptown Branch')

    // Submit valid form
    await user.click(screen.getByRole('button', { name: /common.create/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('branches.createdToast')
    })
    
    expect(createBody.name).toBe('New Uptown Branch')
    expect(createBody.org_id).toBe('org1')
  })

  it('opens edit dialog via edit button and updates branch', async () => {
    const user = userEvent.setup()
    render(<Branches />)

    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument()
    })

    // The datatable row does not open edit on click directly? Ah, it has an actions column with an edit button.
    // The action column uses a ghost button with the Edit2 icon. Let's find it.
    // We can query all buttons and find the one within the Downtown Branch row.
    const editBtn = screen.getByTestId('edit-branch-1')
    await user.click(editBtn)

    await waitFor(() => {
      expect(screen.getByText('branches.editTitle')).toBeInTheDocument()
    })
    
    // Input should be pre-filled
    const nameInput = screen.getByLabelText('branches.branchName')
    expect(nameInput).toHaveValue('Downtown Branch')

    let updateBody: any = null
    server.use(
      getUpdateBranchMockHandler(async (info) => {
        updateBody = await info.request.clone().json()
        return { id: '1', ...updateBody } as any
      })
    )

    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Downtown Branch')

    await user.click(screen.getByRole('button', { name: /common.saveChanges/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('branches.updatedToast')
    })
    
    expect(updateBody.name).toBe('Updated Downtown Branch')
  })

  it('handles branch deletion via confirm dialog', async () => {
    const user = userEvent.setup()
    render(<Branches />)

    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument()
    })

    const deleteBtns = screen.getAllByRole('button').filter(btn => btn.innerHTML.includes('lucide-trash'))
    // Click delete on the first row
    await user.click(deleteBtns[0])

    // Wait for confirm dialog to open
    await waitFor(() => {
      expect(screen.getByText(/common.confirmDelete/i)).toBeInTheDocument()
    })

    server.use(
      getDeleteBranchMockHandler({ success: true } as any)
    )

    // Click confirm inside the confirm dialog
    // The ConfirmDialog usually has a "Confirm" button (or localized)
    // Looking at common confirm dialog, it usually has destructive variant. Let's find the confirm button.
    const confirmBtn = screen.getByRole('button', { name: /common.confirm/i })
    await user.click(confirmBtn)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('branches.deletedToast')
    })
  })
  
  it('closes dialogs on cancel', async () => {
    const user = userEvent.setup()
    render(<Branches />)

    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /common.new/i }))
    expect(screen.getByText('branches.newTitle')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /common.cancel/i }))
    
    await waitFor(() => {
      expect(screen.queryByText('branches.newTitle')).not.toBeInTheDocument()
    })
  })

  it('is responsive: checks mobile classes', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(max-width: 1023px)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
    
    const { container } = render(<Branches />)
    
    const smGrid = container.querySelector('.sm\\:grid-cols-2')
    expect(smGrid).toBeInTheDocument()
  })

  it('validates printer IP and port when printer brand is selected', async () => {
    const user = userEvent.setup()
    render(<Branches />)

    await waitFor(() => {
      expect(screen.getByText('Downtown Branch')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /common.new/i }))
    expect(screen.getByText('branches.newTitle')).toBeInTheDocument()
    
    // Select printer brand
    const selectTrigger = screen.getByRole('combobox', { name: /branches.printerBrand/i })
    await user.click(selectTrigger)
    const starOption = screen.getByRole('option', { name: /Star/i })
    await user.click(starOption)

    // Type a branch name so that validation doesn't fail on name
    await user.type(screen.getByLabelText('branches.branchName'), 'Print Branch')

    // Submit form without IP and Port
    await user.click(screen.getByRole('button', { name: /common.create/i }))

    // Validation should trigger on IP and Port
    await waitFor(() => {
      expect(screen.getAllByText(/String must contain|Required|invalid/i).length).toBeGreaterThan(0)
    })
  })
})
