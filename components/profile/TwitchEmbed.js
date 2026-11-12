'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function TwitchEmbed({ channel }) {
  const t = useTranslations('profile');
  const embedRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!channel) return;
    setStatus('loading');
    const parent = window.location.hostname;
    const containerId = `twitch-embed-${channel}`;

    const initEmbed = () => {
      if (!window.Twitch || !document.getElementById(containerId)) return;
      const embed = new window.Twitch.Embed(containerId, {
        width: '100%',
        height: 400,
        channel,
        layout: 'video',
        autoplay: false,
        parent: [parent],
      });
      embedRef.current = embed;
      embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
        window.clearTimeout(fallbackTimer);
        setStatus((current) => current === 'offline' ? 'offline' : 'ready');
        const player = embed.getPlayer?.();
        if (player && window.Twitch.Player?.OFFLINE) {
          player.addEventListener(window.Twitch.Player.OFFLINE, () => setStatus('offline'));
        }
      });
      if (window.Twitch.Embed.VIDEO_PLAY) {
        embed.addEventListener(window.Twitch.Embed.VIDEO_PLAY, () => {
          window.clearTimeout(fallbackTimer);
          setStatus('ready');
        });
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      setStatus((current) => current === 'loading' ? 'unavailable' : current);
    }, 12000);

    if (window.Twitch) {
      initEmbed();
      return () => {
        window.clearTimeout(fallbackTimer);
        embedRef.current = null;
      };
    }

    const existing = document.querySelector('script[src="https://embed.twitch.tv/embed/v1.js"]');
    if (existing) {
      existing.addEventListener('load', initEmbed);
      return () => {
        window.clearTimeout(fallbackTimer);
        existing.removeEventListener('load', initEmbed);
        embedRef.current = null;
      };
    }

    const script = document.createElement('script');
    script.src = 'https://embed.twitch.tv/embed/v1.js';
    script.async = true;
    script.onload = initEmbed;
    document.body.appendChild(script);

    return () => {
      window.clearTimeout(fallbackTimer);
      embedRef.current = null;
    };
  }, [channel]);

  if (!channel) return null;

  return (
    <div>
      {status === 'loading' && (
        <div className="h-[400px] bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
          <span className="text-gray-500 text-sm">{t('twitch_loading')}</span>
        </div>
      )}
      <div id={`twitch-embed-${channel}`} className={status === 'ready' ? '' : 'hidden'} />
      {(status === 'offline' || status === 'unavailable') && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">{t(status === 'offline' ? 'twitch_offline' : 'twitch_unavailable')}</p>
          <a href={`https://www.twitch.tv/${channel}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-medium text-purple-700 hover:underline">
            {t('twitch_watch_channel', { channel })}
          </a>
        </div>
      )}
    </div>
  );
}
