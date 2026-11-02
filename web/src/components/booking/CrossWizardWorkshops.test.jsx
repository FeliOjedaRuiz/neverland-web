import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Step5Workshops from './Step5Workshops';
import BookingPage from '../../pages/BookingPage';
import BudgetPage from '../../pages/BudgetPage';

// Mock del componente compartido para capturar las props exactas que recibe.
vi.mock('./Step5Workshops', async () => {
  const React = await import('react');
  return {
    default: vi.fn(() =>
      React.createElement('div', { 'data-testid': 'step5-workshops-mock' }, 'Step5Workshops')
    ),
  };
});

vi.mock('../../services/api', () => ({
  getConfig: vi.fn(() => Promise.resolve({ data: {} })),
  createBooking: vi.fn(() => Promise.resolve({ data: { publicId: 'test-id' } })),
  getMonthlyAvailability: vi.fn(() => Promise.resolve({ data: [] })),
}));

describe('Cross-wizard Step5Workshops contract', () => {
  beforeEach(() => {
    Step5Workshops.mockClear();
    // Asegurar un estado de historia inicial para evitar reemplazos inesperados.
    window.history.replaceState({ step: 4 }, '', '');
  });

  const navigateToStep4 = () => {
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate', { state: { step: 4 } }));
    });
  };

  it('BookingPage renderiza Step5Workshops con extras.talleres como array vacío', async () => {
    render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );

    navigateToStep4();

    await waitFor(() => {
      expect(screen.getByTestId('step5-workshops-mock')).toBeDefined();
    });

    expect(Step5Workshops).toHaveBeenCalled();
    const props = Step5Workshops.mock.calls.at(-1)[0];
    expect(Array.isArray(props.formData.extras.talleres)).toBe(true);
    expect(props.formData.extras.talleres).toEqual([]);
    expect(typeof props.setFormData).toBe('function');
    expect(props.WORKSHOPS).toBe(props.prices.workshops);
  });

  it('BudgetPage renderiza Step5Workshops con extras.talleres como array vacío', async () => {
    render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );

    navigateToStep4();

    await waitFor(() => {
      expect(screen.getByTestId('step5-workshops-mock')).toBeDefined();
    });

    expect(Step5Workshops).toHaveBeenCalled();
    const props = Step5Workshops.mock.calls.at(-1)[0];
    expect(Array.isArray(props.formData.extras.talleres)).toBe(true);
    expect(props.formData.extras.talleres).toEqual([]);
    expect(typeof props.setFormData).toBe('function');
    expect(props.WORKSHOPS).toBe(props.prices.workshops);
  });

  it('ambos wizards pasan el mismo contrato de props a Step5Workshops', async () => {
    const { unmount: unmountBooking } = render(
      <MemoryRouter>
        <BookingPage />
      </MemoryRouter>
    );
    navigateToStep4();
    await waitFor(() => screen.getByTestId('step5-workshops-mock'));
    const bookingProps = Step5Workshops.mock.calls.at(-1)[0];
    unmountBooking();

    Step5Workshops.mockClear();

    const { unmount: unmountBudget } = render(
      <MemoryRouter>
        <BudgetPage />
      </MemoryRouter>
    );
    navigateToStep4();
    await waitFor(() => screen.getByTestId('step5-workshops-mock'));
    const budgetProps = Step5Workshops.mock.calls.at(-1)[0];
    unmountBudget();

    const keys = ['formData', 'setFormData', 'WORKSHOPS', 'prices'];
    keys.forEach((key) => {
      expect(typeof bookingProps[key]).toBe(typeof budgetProps[key]);
    });

    expect(Array.isArray(bookingProps.formData.extras.talleres)).toBe(true);
    expect(Array.isArray(budgetProps.formData.extras.talleres)).toBe(true);
    expect(bookingProps.WORKSHOPS).toBe(bookingProps.prices.workshops);
    expect(budgetProps.WORKSHOPS).toBe(budgetProps.prices.workshops);
  });
});
