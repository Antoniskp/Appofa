'use client';
import FormInput from '@/components/ui/FormInput';

export default function ProfileTwitchSection({ twitchChannel, onChange }) {
  return (
    <div className="space-y-2">
      <FormInput
        name="twitchChannel"
        type="text"
        label="Twitch Channel"
        value={twitchChannel || ''}
        onChange={onChange}
        placeholder="yourchannel"
        maxLength={50}
      />
      <p className="text-xs text-gray-500">
        Enter your Twitch channel name only (e.g. <code>shroud</code>), not the full URL. When set, your live stream will appear on your public profile.
      </p>
    </div>
  );
}
