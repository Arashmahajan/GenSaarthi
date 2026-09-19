import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import { RemindersManager } from '../components/RemindersManager';
import { PlanMyDay } from '../components/PlanMyDay';
import { AppProvider } from '../context/AppContext';

describe('Saarthi Frontend Accessible Components', () => {
  it('Navbar renders brand and 5 core navigation items', () => {
    const handleOpenSOS = vi.fn();
    const handleSelectTab = vi.fn();
    const handleOpenSettings = vi.fn();

    render(
      <AppProvider>
        <Navbar
          activeTab="home"
          onSelectTab={handleSelectTab}
          onOpenSOS={handleOpenSOS}
          onOpenSettings={handleOpenSettings}
        />
      </AppProvider>
    );

    // Brand check
    expect(screen.getAllByText(/Saarthi/i).length).toBeGreaterThan(0);

    // Emergency SOS button
    const sosBtn = screen.getByTitle(/Emergency 1930/i);
    expect(sosBtn).toBeInTheDocument();
    fireEvent.click(sosBtn);
    expect(handleOpenSOS).toHaveBeenCalled();

    // Settings button
    const settingsBtn = screen.getByTitle(/Accessibility & Settings/i);
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);
    expect(handleOpenSettings).toHaveBeenCalled();

    // 5 core navigation items check
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Ask')).toBeInTheDocument();
    expect(screen.getByText('Check')).toBeInTheDocument();
    expect(screen.getByText('Reminders & Meds')).toBeInTheDocument();
    expect(screen.getByText('Help & SOS')).toBeInTheDocument();
  });

  it('RemindersManager allows adding and viewing reminders', () => {
    render(
      <AppProvider>
        <RemindersManager />
      </AppProvider>
    );

    // Check empty state
    expect(screen.getByText(/No reminders scheduled/i)).toBeInTheDocument();

    // Add reminder button exists
    const addBtns = screen.getAllByRole('button', { name: /Add Reminder/i });
    expect(addBtns.length).toBeGreaterThan(0);
  });

  it('PlanMyDay renders day planner controls and routine inputs', () => {
    render(
      <AppProvider>
        <PlanMyDay />
      </AppProvider>
    );

    // Check title
    expect(screen.getByRole('heading', { name: /Plan My Day/i })).toBeInTheDocument();

    // Generate schedule button
    const genBtn = screen.getByRole('button', { name: /Plan My Day Schedule/i });
    expect(genBtn).toBeInTheDocument();
  });
});
