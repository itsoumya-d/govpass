import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import EmptyState from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No applications yet"
        description="Check your eligibility for government benefits."
      />
    );

    expect(screen.getByText('No applications yet')).toBeTruthy();
    expect(screen.getByText('Check your eligibility for government benefits.')).toBeTruthy();
  });

  it('renders action button when actionLabel and onAction are provided', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="No applications"
        description="Get started"
        actionLabel="Check Eligibility"
        onAction={onAction}
      />
    );

    const button = screen.getByText('Check Eligibility');
    expect(button).toBeTruthy();
  });

  it('does not render action button when actionLabel is missing', () => {
    render(
      <EmptyState
        title="No applications"
        description="Get started"
      />
    );

    expect(screen.queryByText('Check Eligibility')).toBeNull();
  });

  it('calls onAction when action button is pressed', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="No applications"
        description="Get started"
        actionLabel="Check Eligibility"
        onAction={onAction}
      />
    );

    fireEvent.press(screen.getByText('Check Eligibility'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders with accessibility role on action button', () => {
    const onAction = jest.fn();
    render(
      <EmptyState
        title="Empty"
        description="Nothing here"
        actionLabel="Create"
        onAction={onAction}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeTruthy();
  });
});
