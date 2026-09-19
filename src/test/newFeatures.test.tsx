import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import * as matchers from 'vitest-axe/matchers.js';
import { en } from '../i18n/en';
import { hi } from '../i18n/hi';
import { AppProvider } from '../context/AppContext';
import { DailyCheckIn } from '../components/DailyCheckIn';
import { IncidentChecklist } from '../components/IncidentChecklist';
import { OnboardingWizard } from '../components/OnboardingWizard';
import { BillsSection } from '../components/BillsSection';
import { generateIcsCalendar, foldIcsLine, escapeIcsText } from '../lib/ics';
import { parseAmountValue, formatRupees } from '../lib/money';
import { formatTelUrl, formatWhatsAppUrl } from '../utils/phone';

expect.extend(matchers);

describe('Cross-Cutting: Localization Parity (Hindi & English)', () => {
  it('every English translation key exists in Hindi with non-empty string', () => {
    const enKeys = Object.keys(en) as Array<keyof typeof en>;
    const missingKeys: string[] = [];

    for (const key of enKeys) {
      if (!hi[key] || typeof hi[key] !== 'string' || hi[key].trim() === '') {
        missingKeys.push(key);
      }
    }

    expect(missingKeys).toEqual([]);
  });

  it('every Hindi translation key exists in English', () => {
    const hiKeys = Object.keys(hi) as Array<keyof typeof hi>;
    const extraKeys: string[] = [];

    for (const key of hiKeys) {
      if (!en[key]) {
        extraKeys.push(key);
      }
    }

    expect(extraKeys).toEqual([]);
  });
});

describe('Cross-Cutting: Security & Sanitization Review', () => {
  it('formatTelUrl cleans and rejects malicious schemes like javascript: or CRLF', () => {
    expect(formatTelUrl('1930')).toBe('tel:1930');
    expect(formatTelUrl('+91 98765 43210')).toBe('tel:+919876543210');
    expect(formatTelUrl('javascript:alert(1)')).toBe('tel:');
    expect(formatTelUrl('1930\r\nCC:attacker@hack.com')).toBe('tel:1930');
  });

  it('formatWhatsAppUrl properly percent-encodes dangerous text and scripts', () => {
    const dangerousText = '<script>alert("xss")</script> & "quotes" \n next line';
    const url = formatWhatsAppUrl('+919876543210', dangerousText);
    expect(url).toContain('https://wa.me/919876543210?text=');
    expect(url).not.toContain('<script>');
    expect(url).toContain(encodeURIComponent(dangerousText));
  });

  it('parseAmountValue extracts valid rupee amounts and strictly rejects phone numbers or dates', () => {
    expect(parseAmountValue('₹1,450')).toBe(1450);
    expect(parseAmountValue('Rs. 15000')).toBe(15000);
    expect(parseAmountValue('INR 2,500.50')).toBe(2500.5);
    expect(parseAmountValue('5000/-')).toBe(5000);

    // Rejects 10-digit Indian phone numbers
    expect(parseAmountValue('9876543210')).toBeNull();
    expect(parseAmountValue('+919876543210')).toBeNull();

    // Rejects dates
    expect(parseAmountValue('15-08-2026')).toBeNull();
    expect(parseAmountValue('31/12/2025')).toBeNull();
  });

  it('formatRupees formats currency correctly using Indian grouping', () => {
    expect(formatRupees(1500)).toContain('1,500');
    expect(formatRupees(100000)).toContain('1,00,000');
  });
});

describe('Cross-Cutting: iCalendar (RFC 5545) Specification Compliance', () => {
  it('generates standard RFC 5545 lines with CRLF endings and folded lines', () => {
    const ics = generateIcsCalendar([
      {
        id: 'reminder-123',
        title: 'Electricity Bill Payment for the month of September with Torrent Power',
        description: 'Please pay at official portal before disconnection notice arrives.',
        date: '2026-09-25',
        time: '10:00',
        category: 'bill',
      },
    ]);

    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('VERSION:2.0\r\n');
    expect(ics).toContain('BEGIN:VEVENT\r\n');
    expect(ics).toContain('END:VEVENT\r\n');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('UID:reminder-123@saarthi.local\r\n');

    // CRLF check
    const lines = ics.split('\r\n');
    expect(lines.length).toBeGreaterThan(10);

    // Line folding check: no line should exceed 75 octets
    const encoder = new TextEncoder();
    for (const line of lines) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('escapeIcsText escapes semicolons, commas, newlines and backslashes', () => {
    const raw = 'Dr. Sharma, MD; Clinic\nSpecialist \\ Cardiology';
    const escaped = escapeIcsText(raw);
    expect(escaped).toBe('Dr. Sharma\\, MD\\; Clinic\\nSpecialist \\\\ Cardiology');
  });
});

describe('Cross-Cutting: Accessibility (axe) on Components', () => {
  it('IncidentChecklist renders dialog semantics, emergency numbers, and passes axe check', async () => {
    const handleClose = vi.fn();
    const handleTellFamily = vi.fn();

    const { container } = render(
      <AppProvider>
        <IncidentChecklist
          isOpen={true}
          onClose={handleClose}
          onTellFamily={handleTellFamily}
          initialContext={{ senderNumber: '9876543210', amount: '₹5,000' }}
        />
      </AppProvider>
    );

    // Check dialog semantics
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Select first incident choice (e.g. clicked link or paid money)
    const choiceButtons = screen.getAllByRole('button', { pressed: false });
    if (choiceButtons.length > 0) {
      fireEvent.click(choiceButtons[0]);
    }

    // Advance to Step 2 (Immediate Actions)
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Check critical numbers on step 2
    expect(screen.getByText('1930')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();

    // Run axe check
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false }, // jsdom has no layout/styles
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('OnboardingWizard renders accessible steps and passes axe check', async () => {
    const handleComplete = vi.fn();

    const { container } = render(
      <AppProvider>
        <OnboardingWizard isOpen={true} onComplete={handleComplete} />
      </AppProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Step 1 heading check
    expect(
      screen.getByRole('heading', { level: 2, name: /What should I call you/i })
    ).toBeInTheDocument();

    // Run axe check
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('DailyCheckIn renders with accessible mood buttons and passes axe check', async () => {
    const { container } = render(
      <AppProvider>
        <DailyCheckIn />
      </AppProvider>
    );

    // Check heading
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();

    // Check 3 mood options
    expect(screen.getByText(/^Good$/i)).toBeInTheDocument();
    expect(screen.getByText(/So-so/i)).toBeInTheDocument();
    expect(screen.getByText(/Not good/i)).toBeInTheDocument();

    // Run axe check
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('BillsSection renders summary, handles empty state, and passes axe check', async () => {
    const { container } = render(
      <AppProvider>
        <BillsSection />
      </AppProvider>
    );

    expect(screen.getByText(/Bills This Month/i)).toBeInTheDocument();

    // Run axe check
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });
});
