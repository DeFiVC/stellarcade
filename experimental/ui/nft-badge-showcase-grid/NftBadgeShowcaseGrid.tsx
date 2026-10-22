import React, { useState, useMemo } from 'react';
import type { AchievementBadge, NftBadgeShowcaseGridProps } from './types';

const CATEGORIES = ['All', 'Combat', 'Staking', 'High-Roller', 'Season Special'] as const;

export const NftBadgeShowcaseGrid: React.FC<NftBadgeShowcaseGridProps> = ({
  badges,
  onBadgeClick,
  loading = false,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBadgeModal, setActiveBadgeModal] = useState<AchievementBadge | null>(null);

  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      const matchesCategory =
        selectedCategory === 'All' || badge.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = badge.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [badges, selectedCategory, searchQuery]);

  const handleCardClick = (badge: AchievementBadge) => {
    setActiveBadgeModal(badge);
    onBadgeClick?.(badge);
  };

  const closeModal = () => {
    setActiveBadgeModal(null);
  };

  return (
    <div
      className={`nft-badge-showcase-grid ${className}`}
      style={{
        background: '#090d16',
        color: '#f8fafc',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #1e293b',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9' }}>
            Achievement Badges
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Verifiable Soroban on-chain collectible badges & trophies
          </p>
        </div>

        {/* Search input */}
        <div>
          <input
            type="text"
            data-testid="badge-search-input"
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#131b2e',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '0.85rem',
              outline: 'none',
              minWidth: '200px',
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Badge categories"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '20px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '12px',
        }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              role="tab"
              aria-selected={isSelected}
              data-testid={`category-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedCategory(cat)}
              style={{
                background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#131b2e',
                color: isSelected ? '#ffffff' : '#94a3b8',
                border: isSelected ? '1px solid #60a5fa' : '1px solid #1e293b',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div data-testid="badges-loading-state" style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          Loading achievement badges...
        </div>
      ) : filteredBadges.length === 0 ? (
        <div data-testid="badges-empty-state" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          No badges found matching criteria.
        </div>
      ) : (
        /* Badge Grid */
        <div
          data-testid="badges-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
          }}
        >
          {filteredBadges.map((badge) => {
            const isLocked = !badge.isUnlocked;

            return (
              <div
                key={badge.id}
                role="button"
                tabIndex={0}
                data-testid={`badge-card-${badge.id}`}
                onClick={() => handleCardClick(badge)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(badge);
                  }
                }}
                className={`badge-card ${isLocked ? 'locked' : 'unlocked'}`}
                style={{
                  background: isLocked ? '#111827' : '#131e36',
                  border: isLocked ? '1px solid #1f2937' : '1px solid #3b82f6',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  filter: isLocked ? 'grayscale(100%) opacity(0.7)' : 'none',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Badge Icon / Lock Indicator */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isLocked ? '#1f2937' : 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    marginBottom: '12px',
                    border: isLocked ? '2px solid #374151' : '2px solid #60a5fa',
                  }}
                >
                  {isLocked ? (
                    <span data-testid={`lock-icon-${badge.id}`} aria-label="Locked">
                      🔒
                    </span>
                  ) : (
                    <span>🏅</span>
                  )}
                </div>

                {/* Badge Title */}
                <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                  {badge.title}
                </h4>

                {/* Category Pill */}
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: isLocked ? '#6b7280' : '#38bdf8',
                    background: isLocked ? '#1f2937' : 'rgba(56, 189, 248, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    marginBottom: '8px',
                  }}
                >
                  {badge.category}
                </span>

                {/* Description or Unlock Requirement */}
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: isLocked ? '#9ca3af' : '#94a3b8',
                    lineHeight: '1.3',
                  }}
                >
                  {isLocked
                    ? `Unlock: ${badge.unlockRequirement || 'Achievement locked'}`
                    : badge.description}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge Inspection Modal */}
      {activeBadgeModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-badge-title"
          data-testid="badge-detail-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            backdropFilter: 'blur(4px)',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '440px',
              width: '100%',
              color: '#f8fafc',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: activeBadgeModal.isUnlocked ? '#4ade80' : '#f87171',
                }}
              >
                {activeBadgeModal.isUnlocked ? 'Unlocked Achievement' : 'Locked Achievement'}
              </span>
              <button
                type="button"
                aria-label="Close modal"
                onClick={closeModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Badge Title & Description */}
            <h3 id="modal-badge-title" style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 700 }}>
              {activeBadgeModal.title}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4 }}>
              {activeBadgeModal.description}
            </p>

            {/* Unlock requirements if locked */}
            {!activeBadgeModal.isUnlocked && activeBadgeModal.unlockRequirement && (
              <div
                style={{
                  background: '#1e293b',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  borderLeft: '4px solid #f59e0b',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 600 }}>Unlock Requirement</div>
                <div style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>{activeBadgeModal.unlockRequirement}</div>
              </div>
            )}

            {/* On-chain Details */}
            <div
              style={{
                background: '#090d16',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid #1e293b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Token ID:</span>
                <span data-testid="modal-token-id" style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                  {activeBadgeModal.tokenId || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Issuer:</span>
                <span data-testid="modal-issuer" style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                  {activeBadgeModal.issuer || 'StellarCade Protocol'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mint Timestamp:</span>
                <span data-testid="modal-mint-timestamp" style={{ color: '#cbd5e1' }}>
                  {activeBadgeModal.mintTimestamp ? String(activeBadgeModal.mintTimestamp) : 'Pending Mint'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  background: '#334155',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
