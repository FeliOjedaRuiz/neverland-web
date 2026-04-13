import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookingNavigation from './BookingNavigation';

describe('BookingNavigation Component', () => {
    it('debería llamar a onNext cuando es válido', () => {
        const onNext = vi.fn();
        render(
            <BookingNavigation 
                step={1} 
                totalSteps={8} 
                isValid={true} 
                onNext={onNext} 
            />
        );
        
        const nextBtn = screen.getByText(/Siguiente/i);
        fireEvent.click(nextBtn);
        
        expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('NO debería llamar a onNext cuando es inválido y mostrar mensaje', async () => {
        vi.useFakeTimers();
        const onNext = vi.fn();
        const customMsg = "Selecciona un taller para continuar";
        
        render(
            <BookingNavigation 
                step={1} 
                totalSteps={8} 
                isValid={false} 
                onNext={onNext}
                validationMsg={customMsg}
            />
        );
        
        const nextBtn = screen.getByText(/Siguiente/i);
        fireEvent.click(nextBtn);
        
        // No debe haberse llamado
        expect(onNext).not.toHaveBeenCalled();
        
        // Debe aparecer el mensaje de validación
        expect(screen.getByText(customMsg)).toBeDefined();
        
        // Avanzamos el tiempo para que desaparezca
        act(() => {
            vi.advanceTimersByTime(4000);
        });
        
        expect(screen.queryByText(customMsg)).toBeNull();
        vi.useRealTimers();
    });

    it('debería mostrar el botón de Atrás si showBack es true', () => {
        const onBack = vi.fn();
        render(
            <BookingNavigation 
                step={2} 
                totalSteps={8} 
                showBack={true} 
                onBack={onBack} 
            />
        );
        
        const backBtn = screen.getByText(/Atrás/i);
        fireEvent.click(backBtn);
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('debería mostrar el botón de Submit en el último paso', () => {
        const onSubmit = vi.fn();
        render(
            <BookingNavigation 
                step={8} 
                totalSteps={8} 
                onSubmit={onSubmit} 
                submitLabel="Finalizar"
            />
        );
        
        const submitBtn = screen.getByText(/Finalizar/i);
        fireEvent.click(submitBtn);
        expect(onSubmit).toHaveBeenCalledTimes(1);
    });
});
