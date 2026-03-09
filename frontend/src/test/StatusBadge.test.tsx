// test/StatusBadge.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '../components/common/StatusBadge'

describe('StatusBadge', () => {
  it('renders CREATED status with correct label', () => {
    render(<StatusBadge status="CREATED" />)
    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  it('renders IN_PROGRESS status', () => {
    render(<StatusBadge status="IN_PROGRESS" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('renders DONE status with green styling', () => {
    render(<StatusBadge status="DONE" />)
    const badge = screen.getByText('Done')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('renders CANCELLED status with red styling', () => {
    render(<StatusBadge status="CANCELLED" />)
    const badge = screen.getByText('Cancelled')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('renders ALLOCATED status with purple styling', () => {
    render(<StatusBadge status="ALLOCATED" />)
    const badge = screen.getByText('Allocated')
    expect(badge).toHaveClass('bg-purple-100', 'text-purple-800')
  })

  it('renders DRAFT status', () => {
    render(<StatusBadge status="DRAFT" />)
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })
})