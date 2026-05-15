'use client';

import { useTranslations } from 'next-intl';
import Card from '@/components/ui/Card';
import ProfileProfessionsSection from '@/components/profile/ProfileProfessionsSection';
import ProfileExpertiseSection from '@/components/profile/ProfileExpertiseSection';
import ProfileInterestsSection from '@/components/profile/ProfileInterestsSection';
import ProfileBadgesSection from '@/components/profile/ProfileBadgesSection';

export default function SkillsTab({
  profileData,
  profPicker,
  intPicker,
  badgeProgress,
  badgeEvaluating,
  displayBadge,
  savingDisplayBadge,
  setProfPicker,
  setIntPicker,
  handleAddProfession,
  handleRemoveProfession,
  handleAddExpertise,
  handleRemoveExpertise,
  handleAddInterest,
  handleRemoveInterest,
  handleEvaluateBadges,
  handleSelectDisplayBadge,
  handleClearDisplayBadge,
}) {
  const tProfile = useTranslations('profile');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('professions_expertise')}</h2>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{tProfile('professions')} <span className="text-gray-400 text-xs font-normal">({tCommon('max_count', { count: 5 })})</span></h3>
        <ProfileProfessionsSection
          professions={profileData.professions}
          picker={profPicker}
          onPickerChange={setProfPicker}
          onAdd={handleAddProfession}
          onRemove={handleRemoveProfession}
        />
        <hr className="my-6 border-gray-200" />
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{tProfile('expertise_area')} <span className="text-gray-400 text-xs font-normal">({tCommon('max_count', { count: 5 })})</span></h3>
        <ProfileExpertiseSection
          expertiseArea={profileData.expertiseArea}
          onAdd={handleAddExpertise}
          onRemove={handleRemoveExpertise}
        />
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{tProfile('interests')}</h2>
        <ProfileInterestsSection
          interests={profileData.interests}
          picker={intPicker}
          onPickerChange={setIntPicker}
          onAdd={handleAddInterest}
          onRemove={handleRemoveInterest}
        />
      </Card>

      <Card>
        <ProfileBadgesSection
          badgeProgress={badgeProgress}
          badgeEvaluating={badgeEvaluating}
          displayBadge={displayBadge}
          savingDisplayBadge={savingDisplayBadge}
          onEvaluate={handleEvaluateBadges}
          onSelectDisplayBadge={handleSelectDisplayBadge}
          onClearDisplayBadge={handleClearDisplayBadge}
        />
      </Card>
    </div>
  );
}
