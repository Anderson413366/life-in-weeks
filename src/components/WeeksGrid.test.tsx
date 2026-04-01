import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WeeksGrid from './WeeksGrid';

describe('WeeksGrid Component', () => {
  const onWeekClick = vi.fn();
  const defaultProps = {
    weeksPassed: 500, // Roughly 9.6 years
    totalYears: 80,
    birthdate: '1990-01-01',
    onHover: vi.fn(),
    onWeekClick,
    diaryEntries: {},
    scale: 1,
  };

  beforeEach(() => {
    onWeekClick.mockClear();
  });

  it('renders correctly with year labels', () => {
    render(<WeeksGrid {...defaultProps} />);
    // Check for some year labels
    // Use getAllByText because '10' can be both a week number and a year label
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('10').length).toBeGreaterThan(0);
    expect(screen.getByText('79')).toBeInTheDocument();
  });

  it('calls onWeekClick when a past week is clicked', () => {
    render(<WeeksGrid {...defaultProps} />);

    const pastWeek = screen.getByLabelText(/Year 0, Week 1, starting .* Past week\./i);

    fireEvent.click(pastWeek);
    expect(onWeekClick).toHaveBeenCalledWith(0, 0, 0);
  });

  it('does not call onWeekClick when a future week is clicked', () => {
    render(<WeeksGrid {...defaultProps} />);

    const futureWeek = screen.getByLabelText(/Year 20, Week 1, starting .* Future week\./i);

    fireEvent.click(futureWeek);
    expect(onWeekClick).not.toHaveBeenCalled();
  });
});
