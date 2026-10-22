# NFT Achievement Badge Showcase Grid

An experimental gallery component for displaying player collectible achievement badges on Stellar Soroban with tier category tabs, search filtering, locked/unlocked visual indicators, and token inspection modals.

## Features
- **Responsive Card Grid**: Auto-wrapping badge cards with glowing borders and status indicators.
- **Category Tabs**: Filter between Combat, Staking, High-Roller, Season Special, and All.
- **Locked State Treatment**: Grayscale styling with lock badge and unlock criteria explanation.
- **Detail Inspection Modal**: Full popup displaying on-chain token ID, issuer address, and mint timestamp.
- **Search Filtering**: Real-time filtering by badge title.

## Usage

```tsx
import { NftBadgeShowcaseGrid } from './NftBadgeShowcaseGrid';
import type { AchievementBadge } from './types';

const badges: AchievementBadge[] = [
  {
    id: 'badge-1',
    tokenId: '0x12345678',
    title: 'High-Roller Champ',
    description: 'Wager 10,000 XLM across any arcade game.',
    category: 'High-Roller',
    isUnlocked: true,
  },
];

export function ProfileBadges() {
  return (
    <NftBadgeShowcaseGrid
      badges={badges}
      onBadgeClick={(badge) => console.log('Badge clicked:', badge)}
    />
  );
}
```

## Running Tests

```bash
npm test
```
