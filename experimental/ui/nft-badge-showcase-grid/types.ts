export type BadgeCategory = 'Combat' | 'Staking' | 'High-Roller' | 'Season Special' | string;

export interface AchievementBadge {
  id: string;
  tokenId?: string;
  title: string;
  description: string;
  category: BadgeCategory;
  imageUrl?: string;
  isUnlocked: boolean;
  unlockRequirement?: string;
  issuer?: string;
  mintTimestamp?: string | number;
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface NftBadgeShowcaseGridProps {
  badges: AchievementBadge[];
  onBadgeClick?: (badge: AchievementBadge) => void;
  loading?: boolean;
  className?: string;
}
