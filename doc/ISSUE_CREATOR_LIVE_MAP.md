# Issue: Creator live and viral video map layer

## Goal

Turn the cameras page into a live discovery map where existing camera locations can also surface approved creator content: TikTok Live links, Instagram/YouTube short-form links, and viral videos tied to the same real-world places.

## User Story

As a TikToker or local creator, I want to pin my live stream or viral video to a real map location so people already watching that place can discover my content.

As an Appofa visitor, I want to switch between cameras, live creators, and viral videos so I can understand what is happening in a place from both fixed cameras and human creators.

## Product Shape

- Existing camera pins remain the base layer.
- Creator live pins are attached to mapped camera locations.
- Viral video pins are attached to mapped camera locations.
- Users can filter cameras, live creator links, and viral videos.
- Creator submissions should be stored as pending moderation before public display.
- Live links should expire automatically; viral links can have a longer retention period.

## MVP Implemented

- Adds a "Pin a creator link" panel to `/cameras`.
- Allows an in-session creator/viral link to be attached to an existing mapped camera.
- Validates title, mapped camera selection, and safe social URL host.
- Adds map filters for creator live links and viral videos.
- Adds distinct Leaflet marker styles for live creator links and viral videos.
- Keeps camera marker behavior intact.

## Backend Follow-Up

- Add a `map_social_links` table with fields:
  - `id`
  - `type`: `creator_live` or `viral_video`
  - `title`
  - `creator_handle`
  - `platform`
  - `url`
  - `location_id`
  - `camera_section_id` or source camera reference
  - `lat`
  - `lng`
  - `status`: `pending`, `approved`, `rejected`, `expired`
  - `expires_at`
  - `submitted_by`
  - `reviewed_by`
- Add public API for approved map content.
- Add authenticated submission API.
- Add admin moderation queue.
- Add automatic expiry for live links.
- Add reporting/removal flow.

## Guardrails

- Do not publish arbitrary user links without moderation.
- Only allow trusted social/video hosts at first.
- Expire live links by default.
- Keep exact location choices tied to existing camera/location data in the first version.
- Add disclosure guidance for paid/sponsored creator content later.

## Success Metrics

- Creator link submissions per week.
- Approved creator pins.
- Map clicks on creator/viral pins.
- Camera page engagement time.
- Conversion from creator pin click to social link open.
- Repeat submissions by the same creator.
