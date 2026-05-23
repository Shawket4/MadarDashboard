import { render, screen, waitFor, queryClient } from '@/test/utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import Orgs from '../orgs'
import { env } from '@/shared/config/env'
import { toast } from 'sonner'

const API_URL = env.VITE_API_URL

// Mock exportToExcel to avoid actual file saving during tests
vi.mock('@/shared/lib/excel', () => ({
  exportToExcel: vi.fn(),
}))

const mockOrgs = [
  { id: '1', name: 'Test Org', slug: 'test-org', currency_code: 'EGP', tax_rate: 15, is_active: true },
  { id: '2', name: 'Inactive Org', slug: 'inactive-org', currency_code: 'USD', tax_rate: 0, is_active: false },
]

describe('Orgs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    
    server.use(
      http.get(`${API_URL}/orgs`, () => {
        return HttpResponse.json(mockOrgs)
      })
    )
  })

  it('renders list of organizations and stats', async () => {
    render(<Orgs />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Org')).toBeInTheDocument()
      expect(screen.getByText('Inactive Org')).toBeInTheDocument()
    })

    // Check stats (Total 2, Active 1, Inactive 1)
    expect(screen.getAllByText('2').length).toBeGreaterThan(0) // Total
    expect(screen.getAllByText('1').length).toBeGreaterThan(0) // Active / Inactive
  })

  it('handles empty state and API errors', async () => {
    server.use(
      http.get(`${API_URL}/orgs`, () => {
        return HttpResponse.json({ message: 'Error' }, { status: 500 })
      })
    )

    render(<Orgs />)
    
    await waitFor(() => {
      expect(screen.getByText('common.noResults')).toBeInTheDocument()
    })
  })

  it('opens new org dialog, validates empty submission, and creates org', async () => {
    const user = userEvent.setup()
    render(<Orgs />)

    await waitFor(() => {
      expect(screen.getByText('Test Org')).toBeInTheDocument()
    })

    // Open new dialog
    await user.click(screen.getByRole('button', { name: /common.new/i }))
    
    expect(screen.getByText('orgs.newTitle')).toBeInTheDocument()
    
    // Submit empty form to trigger validation
    await user.click(screen.getByRole('button', { name: /common.create/i }))
    
    // Check validation (depends on Zod schema, usually requires name and slug)
    // We expect react-hook-form to show error messages, user-event triggers them
    // Assuming required fields error out
    await waitFor(() => {
      expect(screen.getAllByText(/String must contain|Required|invalid/i).length).toBeGreaterThan(0)
    })

    // Mock successful creation
    let createBody: any = null
    server.use(
      http.post(`${API_URL}/orgs`, async ({ request }) => {
        // Handle multipart/form-data because orgApi.create uses FormData
        const formData = await request.formData()
        createBody = Object.fromEntries(formData.entries())
        return HttpResponse.json({ id: '3', name: createBody.name, slug: createBody.slug })
      })
    )

    // Type valid data
    const nameInput = screen.getByLabelText('orgs.orgName')
    await user.type(nameInput, 'New Startup')

    // Slug should auto-generate to 'new-startup' based on onChange logic
    const slugInput = screen.getByLabelText('orgs.slug')
    expect(slugInput).toHaveValue('new-startup')

    // Submit valid form
    await user.click(screen.getByRole('button', { name: /common.create/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('orgs.createdToast')
    })

    // Check payload
    expect(createBody.name).toBe('New Startup')
    expect(createBody.slug).toBe('new-startup')
  })

  it('opens edit dialog when row is clicked and updates org', async () => {
    const user = userEvent.setup()
    render(<Orgs />)

    await waitFor(() => {
      expect(screen.getByText('Test Org')).toBeInTheDocument()
    })

    // Click on row to edit
    await user.click(screen.getByText('Test Org'))

    expect(screen.getByText('orgs.editTitle')).toBeInTheDocument()
    
    // Input should be pre-filled
    const nameInput = screen.getByLabelText('orgs.orgName')
    expect(nameInput).toHaveValue('Test Org')

    let patchBody: any = null
    server.use(
      http.patch(`${API_URL}/orgs/1`, async ({ request }) => {
        patchBody = await request.json()
        return HttpResponse.json({ id: '1', ...patchBody })
      })
    )

    await user.clear(nameInput)
    await user.type(nameInput, 'Updated Org')

    await user.click(screen.getByRole('button', { name: /common.saveChanges/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('orgs.updatedToast')
    })
    
    expect(patchBody.name).toBe('Updated Org')
  })
  
  it('closes dialog on cancel or escape', async () => {
    const user = userEvent.setup()
    render(<Orgs />)

    await waitFor(() => {
      expect(screen.getByText('Test Org')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /common.new/i }))
    expect(screen.getByText('orgs.newTitle')).toBeInTheDocument()

    // Click cancel
    await user.click(screen.getByRole('button', { name: /common.cancel/i }))
    
    await waitFor(() => {
      expect(screen.queryByText('orgs.newTitle')).not.toBeInTheDocument()
    })

    // Open again and press escape
    await user.click(screen.getByRole('button', { name: /common.new/i }))
    expect(screen.getByText('orgs.newTitle')).toBeInTheDocument()
    
    await user.keyboard('{Escape}')
    
    await waitFor(() => {
      expect(screen.queryByText('orgs.newTitle')).not.toBeInTheDocument()
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
    
    const { container } = render(<Orgs />)
    
    const smGrid = container.querySelector('.sm\\:grid-cols-2')
    expect(smGrid).toBeInTheDocument()
  })
})
