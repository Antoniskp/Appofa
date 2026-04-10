'use client';
import { useEffect, useRef, useState } from 'react';

export default function TwitchEmbed({ channel }) {
  const embedRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!channel) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    let parent = 'localhost';
    try {
      parent = new URL(apiUrl).hostname;
    } catch {
      parent = 'localhost';
    }
    const containerId = `twitch-embed-${channel}`;

    const initEmbed = () => {
      if (!window.Twitch || !document.getElementById(containerId)) return;
      embedRef.current = new window.Twitch.Embed(containerId, {
        width: '100%',
        height: 400,
        channel,
        layout: 'video',
        autoplay: false,
        parent: [parent],
      });
      setLoaded(true);
    };

    if (window.Twitch) {
      initEmbed();
      return;
    }

    const existing = document.querySelector('script[src="https://embed.twitch.tv/embed/v1.js"]');
    if (existing) {
      existing.addEventListener('load', initEmbed);
      return () => existing.removeEventListener('load', initEmbed);
    }

    const script = document.createElement('script');
    script.src = 'https://embed.twitch.tv/embed/v1.js';
    script.async = true;
    script.onload = initEmbed;
    document.body.appendChild(script);

    return () => {
      embedRef.current = null;
    };
  }, [channel]);

  if (!channel) return null;

  return (
    <div>
      {!loaded && (
        <div className="h-[400px] bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading stream…</span>
        </div>
      )}
      <div id={`twitch-embed-${channel}`} className={loaded ? '' : 'hidden'} />
    </div>
  );
}
