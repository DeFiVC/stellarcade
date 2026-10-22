import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NftBadgeShowcaseGrid } from './NftBadgeShowcaseGrid';
import type { AchievementBadge } from './types';

describe('NftBadgeShowcaseGrid', () => {
  const mockBadges: AchievementBadge[] = [
    {
      id: 'combat-1',
      tokenId: 'NFT_COMBAT_001',
      title: 'Arena Gladiator',
      description: 'Win 50 PVP Coinflip battles in a row.',
      category: 'Combat',
      isUnlocked: true,
      issuer: 'G...STELLARCADE',
      mintTimestamp: '2026-09-01T12:00:00Z',
    },
    {
      id: 'staking-1',
      tokenId: 'NFT_STAKE_002',
      title: 'Diamond Vault',
      description: 'Lock 5,000 XLM for at least 30 days.',
      category: 'Staking',
      isUnlocked: false,
      unlockRequirement: 'Stake 5,000 XLM in liquidity pool',
    },
    {
      id: 'roller-1',
      tokenId: 'NFT_ROLLER_003',
      title: 'High-Roller Whale',
      description: 'Place a single wager exceeding 1,000 XLM.',
      category: 'High-Roller',
      isUnlocked: false,
      unlockRequirement: 'Place a 1,000+ XLM wager',
    },
  ];

  it('renders all badges initially', () => {
    render(<NftBadgeShowcaseGrid badges={mockBadges} />);

    expect(screen.getByTestId('badge-card-combat-1')).toBeDefined();
    expect(screen.getByTestId('badge-card-staking-1')).toBeDefined();
    expect(screen.getByTestId('badge-card-roller-1')).toBeDefined();
  });

  it('category tab click filters badge items', () => {
    render(<NftBadgeShowcaseGrid badges={mockBadges} />);

    // Click 'Combat' tab
    const combatTab = screen.getByTestId('category-tab-combat');
    fireEvent.click(combatTab);

    expect(screen.getByTestId('badge-card-combat-1')).toBeDefined();
    expect(screen.queryByTestId('badge-card-staking-1')).toBeNull();
    expect(screen.queryByTestId('badge-card-roller-1')).toBeNull();

    // Click 'Staking' tab
    const stakingTab = screen.getByTestId('category-tab-staking');
    fireEvent.click(stakingTab);

    expect(screen.queryByTestId('badge-card-combat-1')).toBeNull();
    expect(screen.getByTestId('badge-card-staking-1')).toBeDefined();
  });

  it('locked badges render locked styling and requirements', () => {
    render(<NftBadgeShowcaseGrid badges={mockBadges} />);

    const lockedCard = screen.getByTestId('badge-card-staking-1');
    expect(lockedCard).toHaveClass('locked');
    expect(screen.getByTestId('lock-icon-staking-1')).toBeDefined();
    expect(lockedCard).toHaveTextContent('Unlock: Stake 5,000 XLM in liquidity pool');

    const unlockedCard = screen.getByTestId('badge-card-combat-1');
    expect(unlockedCard).toHaveClass('unlocked');
  });

  it('badge click opens detail modal displaying token ID, issuer, and metadata', () => {
    const handleBadgeClick = vi.fn();
    render(<NftBadgeShowcaseGrid badges={mockBadges} onBadgeClick={handleBadgeClick} />);

    const card = screen.getByTestId('badge-card-combat-1');
    fireEvent.click(card);

    expect(handleBadgeClick).toHaveBeenCalledWith(mockBadges[0]);
    expect(screen.getByTestId('badge-detail-modal')).toBeDefined();
    expect(screen.getByTestId('modal-token-id')).toHaveTextContent('NFT_COMBAT_001');
    expect(screen.getByTestId('modal-issuer')).toHaveTextContent('G...STELLARCADE');
    expect(screen.getByTestId('modal-mint-timestamp')).toHaveTextContent('2026-09-01T12:00:00Z');

    // Close modal
    const closeBtn = screen.getByLabelText('Close modal');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('badge-detail-modal')).toBeNull();
  });

  it('filters badges by search query', () => {
    render(<NftBadgeShowcaseGrid badges={mockBadges} />);

    const searchInput = screen.getByTestId('badge-search-input');
    fireEvent.change(searchInput, { target: { value: 'gladiator' } });

    expect(screen.getByTestId('badge-card-combat-1')).toBeDefined();
    expect(screen.queryByTestId('badge-card-staking-1')).toBeNull();
  });
});
