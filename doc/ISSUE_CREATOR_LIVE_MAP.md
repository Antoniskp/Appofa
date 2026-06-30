# Issue: Curated creator and viral video map layer

## Goal

Let Appofa optionally surface hand-approved creator links and viral videos around existing camera locations without depending on TikTok API access or adding a complicated public submission flow.

## User Story

As an admin/moderator, I want to add an approved creator link or viral video to a mapped location so the cameras page can show useful local context without opening the map to spam.

As an Appofa visitor, I want the camera map to stay simple first, with optional curated social context only when the team has reviewed it.

## Product Shape

- Existing camera pins remain the primary experience.
- No public "add TikTok link" form on the cameras page.
- No TikTok API dependency for the first version.
- Admins can manually add approved social/video URLs later.
- Public display should happen only after moderation.
- Live links should expire automatically if used; viral links can have a longer retention period.

## Decision

Do not add a creator submission box to `/cameras` right now. It is too much friction, creates moderation risk, and implies a TikTok integration we do not currently have.

Keep the cameras page focused on cameras. Revisit social pins only as an admin-curated layer after the camera map itself feels strong.

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
- Add admin CRUD for approved map content.
- Add public API for approved map content only.
- Add admin moderation queue.
- Add automatic expiry for live links.
- Add reporting/removal flow.

## Guardrails

- Do not publish arbitrary user links without moderation.
- Only allow trusted social/video hosts at first.
- Expire live links by default.
- Keep exact location choices tied to existing camera/location data in the first version.
- Do not require TikTok API access for MVP.
- Add disclosure guidance for paid/sponsored creator content later.

## Success Metrics

- Creator link submissions per week.
- Approved creator pins.
- Map clicks on creator/viral pins.
- Camera page engagement time.
- Conversion from creator pin click to social link open.
- Repeat submissions by the same creator.
