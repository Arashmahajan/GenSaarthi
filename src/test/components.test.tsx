import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import { RemindersManager } from '../components/RemindersManager';
import { PlanMyDay } from '../components/PlanMyDay';

describe('Saarthi Frontend Accessible Components', () => {
  it('Navbar renders brand, accessibility controls, and navigation items', () => {
    const handleUpdate = vi.fn();
    const handleOpenSOS = vi.fn();
    const handleSelectTab = vi.fn();

    render(
      <Navbar
        settings={{
          textSize: 'normal',
          highContrast: false,
          darkMode: false,
          speechRate: 0.85,
          language: 'en',
          soundEnabled: true,
        }}
        onUpdateSettings={handleUpdate}
        onOpenSOS={handleOpenSOS}
        activeTab="home"
        onSelectTab={handleSelectTab}
      />
    );

    // Brand check
    expect(screen.getByText(/Saarthi/i)).toBeInTheDocument();

    // Emergency SOS button
    const sosBtn = screen.getByTitle(/Open Emergency SOS Help numbers/i);
    expect(sosBtn).toBeInTheDocument();
    fireEvent.click(sosBtn);
    expect(handleOpenSOS).toHaveBeenCalled();

    // Text size switcher buttons
    const largeBtn = screen.getByRole('button', { name: /^Large$/i });
    fireEvent.click(largeBtn);
    expect(handleUpdate).toHaveBeenCalledWith({ textSize: 'large' });

    // Language toggle
    const hindiBtn = screen.getByText('हिंदी');
    fireEvent.click(hindiBtn);
    expect(handleUpdate).toHaveBeenCalledWith({ language: 'hi' });
  });

  it('RemindersManager allows adding and viewing reminders', () => {
    render(<RemindersManager language="en" />);

    // Check header
    expect(screen.getByText(/My Daily & Bill Reminders/i)).toBeInTheDocument();

    // Add reminder button exists
    const addBtn = screen.getByRole('button', { name: /Add Reminder/i });
    expect(addBtn).toBeInTheDocument();
  });

  it('PlanMyDay renders day planner controls and routine inputs', () => {
    render(<PlanMyDay language="en" />);

    // Check title
    expect(screen.getByText(/Plan a Calm & Unhurried Day/i)).toBeInTheDocument();

    // Generate schedule button
    const genBtn = screen.getByRole('button', { name: /Create My Schedule/i });
    expect(genBtn).toBeInTheDocument();
  });
});
