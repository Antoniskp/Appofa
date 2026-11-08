'use client';
import FormInput from '@/components/ui/FormInput';
import { useTranslations } from 'next-intl';

export default function ProfileTwitchSection({ twitchChannel, onChange }) {
  const t = useTranslations('profile');
  return (
    <div className="space-y-2">
      <FormInput
        name="twitchChannel"
        type="text"
        label={t('twitch_channel')}
        value={twitchChannel || ''}
        onChange={onChange}
        placeholder={t('twitch_channel_placeholder')}
        maxLength={50}
      />
      <p className="text-xs text-gray-500">
        {t('twitch_channel_help')}
      </p>
    </div>
  );
}
