import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { axe } from 'vitest-axe';
import App from '@/App';

// Mock scrollIntoView which is not available in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe('Integration: Full Documentation Flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes patient selection → input → AI response → summary → edit → finalize', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // 1. Verify patient list is shown
    expect(screen.getByText('Select a Patient')).toBeInTheDocument();
    expect(screen.getByText('Margaret Thompson')).toBeInTheDocument();

    // 2. Click on "Margaret Thompson" patient card
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    // 3. Verify checklist is displayed with Diabetes + Hypertension items
    expect(screen.getByText('Checklist')).toBeInTheDocument();
    expect(screen.getByText('Blood glucose level')).toBeInTheDocument();
    expect(screen.getByText('Insulin administered')).toBeInTheDocument();
    expect(screen.getByText('Blood pressure reading')).toBeInTheDocument();
    expect(screen.getByText('Heart rate recorded')).toBeInTheDocument();

    // 4. Verify conversation panel is shown
    expect(screen.getByLabelText('Conversation panel')).toBeInTheDocument();

    // 5. Type input and submit
    const input = screen.getByLabelText('Enter your nursing observations');
    await user.click(input);
    await user.type(input, 'Blood pressure was 130/85 today');

    // Submit with Enter key
    await user.keyboard('{Enter}');

    // 6. Advance timers for AI processing (max 2000ms delay)
    await vi.advanceTimersByTimeAsync(2500);

    // 7. Verify nurse message appears in conversation
    await waitFor(() => {
      expect(
        screen.getByText('Blood pressure was 130/85 today')
      ).toBeInTheDocument();
    });

    // 8. Verify AI acknowledgment message appears (from message history)
    const conversationLog = screen.getByRole('log');
    await waitFor(() => {
      const messages = within(conversationLog).getAllByRole('article');
      // Should have at least 2 messages: nurse input + AI response
      expect(messages.length).toBeGreaterThanOrEqual(2);
    });

    // 9. Verify "Generate Shift Summary" button is now visible (notes exist)
    const generateButton = await screen.findByRole('button', {
      name: /Generate shift summary/i,
    });
    expect(generateButton).toBeInTheDocument();

    // 10. Click "Generate Shift Summary"
    await user.click(generateButton);

    // 11. Advance timers for summary generation delay
    await vi.advanceTimersByTimeAsync(2500);

    // 12. Verify summary sections are displayed
    await waitFor(() => {
      expect(screen.getByText('Shift Summary')).toBeInTheDocument();
    });

    // 13. Find an edit button and click it to edit a section
    const editButtons = await screen.findAllByRole('button', {
      name: /Edit .* section/i,
    });
    expect(editButtons.length).toBeGreaterThan(0);
    await user.click(editButtons[0]);

    // 14. Verify textarea appears for editing
    const textarea = await screen.findByRole('textbox', {
      name: /Editing .* content/i,
    });
    expect(textarea).toBeInTheDocument();

    // 15. Change content
    await user.clear(textarea);
    await user.type(textarea, 'Updated summary content for testing');

    // 16. Save the edit
    const saveButton = screen.getByRole('button', { name: /Save changes/i });
    await user.click(saveButton);

    // 17. Verify content is updated
    await waitFor(() => {
      expect(
        screen.getByText('Updated summary content for testing')
      ).toBeInTheDocument();
    });

    // 18. Click "Finalize Summary"
    const finalizeButton = screen.getByRole('button', {
      name: /Finalize shift summary/i,
    });
    await user.click(finalizeButton);

    // 19. Verify success banner appears
    await waitFor(() => {
      expect(
        screen.getByText('Summary finalized successfully')
      ).toBeInTheDocument();
    });
  });
});

describe('Integration: Checklist Toggle', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('toggles a checklist item between checked and unchecked states', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Select a patient
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    // Find a checklist item checkbox
    const checkbox = screen.getByRole('checkbox', {
      name: /Blood glucose level/i,
    });
    expect(checkbox).not.toBeChecked();

    // Check it
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // Uncheck it
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('updates progress indicator when items are checked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Select Margaret Thompson (has Diabetes + Hypertension = 10 items)
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    // Initially 0 of 10 completed
    expect(screen.getByText('0 of 10 completed')).toBeInTheDocument();

    // Check one item
    const checkbox = screen.getByRole('checkbox', {
      name: /Blood glucose level/i,
    });
    await user.click(checkbox);

    // Now 1 of 10 completed
    expect(screen.getByText('1 of 10 completed')).toBeInTheDocument();
  });
});

describe('Integration: Patient Info Display', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays correct patient information for Robert Chen', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Select Robert Chen
    const robertCard = screen.getByRole('button', {
      name: /Select patient Robert Chen/i,
    });
    await user.click(robertCard);

    // Verify patient info header (h2 in the patient info section)
    const patientSection = screen.getByLabelText('Patient information');
    expect(within(patientSection).getByText('Robert Chen')).toBeInTheDocument();
    expect(within(patientSection).getByText(/Room 112B/)).toBeInTheDocument();
    expect(within(patientSection).getByText(/Age 85/)).toBeInTheDocument();

    // Verify conditions are displayed
    expect(within(patientSection).getByText('Heart Failure')).toBeInTheDocument();
    expect(within(patientSection).getByText('COPD')).toBeInTheDocument();

    // Verify allergies are displayed
    expect(within(patientSection).getByText('Sulfa drugs')).toBeInTheDocument();
  });

  it('displays correct patient information for Margaret Thompson', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Select Margaret Thompson
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    // Verify patient info within the patient info section (avoids Header duplicate)
    const patientSection = screen.getByLabelText('Patient information');
    expect(within(patientSection).getByText('Margaret Thompson')).toBeInTheDocument();
    expect(within(patientSection).getByText(/Room 204A/)).toBeInTheDocument();
    expect(within(patientSection).getByText(/Age 78/)).toBeInTheDocument();

    // Verify conditions
    expect(within(patientSection).getByText('Type 2 Diabetes')).toBeInTheDocument();
    expect(within(patientSection).getByText('Hypertension')).toBeInTheDocument();

    // Verify allergies
    expect(within(patientSection).getByText('Penicillin')).toBeInTheDocument();
  });
});

describe('Integration: Accessibility Audit', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('has no accessibility violations on patient list view', async () => {
    const { container } = render(<App />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });

  it('has no accessibility violations on documentation session view', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(<App />);

    // Select a patient to enter documentation view
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe('Integration: Touch Target Sizes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('patient selection buttons have minimum 44px touch targets', async () => {
    render(<App />);

    const patientButtons = screen.getAllByRole('button', {
      name: /Select patient/i,
    });

    for (const button of patientButtons) {
      // Check that the button has min-h-[44px] in its class list (Tailwind utility)
      expect(button.className).toMatch(/min-h-\[44px\]/);
    }
  });

  it('checklist items have minimum 44px touch targets', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Select a patient
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    // Checklist labels should have min-h-[44px]
    const checkboxLabels = screen
      .getAllByRole('checkbox')
      .map((cb) => cb.closest('label'));

    for (const label of checkboxLabels) {
      expect(label).not.toBeNull();
      expect(label!.className).toMatch(/min-h-\[44px\]/);
    }
  });

  it('submit button has minimum 44px touch target', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<App />);

    // Select a patient
    const margaretCard = screen.getByRole('button', {
      name: /Select patient Margaret Thompson/i,
    });
    await user.click(margaretCard);

    // Submit observation button
    const submitButton = screen.getByRole('button', {
      name: /Submit observation/i,
    });
    expect(submitButton.className).toMatch(/min-w-\[44px\]/);
    expect(submitButton.className).toMatch(/min-h-\[44px\]/);
  });
});
