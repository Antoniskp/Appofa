# Photo delivery

Uploaded media is resized and converted to WebP when uploaded. Next.js creates
responsive sizes on demand and caches them in `.next/cache/images`. Card `sizes`
must describe the rendered layout; override `imageSizes` for custom card layouts.
WebP is the optimizer output format to reduce encoding work on a cache miss.

Express serves `/uploads` before the API middleware. UUID media variants under
`uploads/media/YYYY/MM/` are public and immutable for one year. Stable filenames
(including avatars and location photos) revalidate with ETag/Last-Modified, so
replacing a file does not leave direct requests with a year-old photo. Continue
changing the image URL/version after replacement when using the Next optimizer:
its own minimum cache lifetime also applies.

Both checked-in nginx configurations route `/uploads/` directly to Express.
After deploying the application, install the appropriate nginx configuration,
run `sudo nginx -t`, and reload nginx. The Next.js uploads route remains a
streaming fallback for local development and installations without this rule.
It forwards cache headers and conditional requests without storing a second
copy in the Next data cache.

`scripts/deploy.sh` preserves `.next/cache` when cleaning builds. Keep this cache
on persistent disk; any other deployment process that deletes/replaces the
directory will cause image encoding to start over. A change of output format
also requires generating the new format once.

## Production validation

- Check an actual UUID media URL for `Cache-Control: public,
  max-age=31536000, immutable`.
- Check an avatar URL for `max-age=0, must-revalidate` and an ETag. Request it
  with `If-None-Match` to confirm 304, then replace the image and confirm 200.
- Compare cold and repeated `/_next/image` requests and their `X-Nextjs-Cache`
  headers. Check transferred bytes at phone and desktop viewport sizes.
- Load-test staging using representative images and cold/warm caches; record
  latency, error rate, frontend CPU, memory, and outbound bandwidth. Local
  regression tests do not establish the number of users production can handle.

Media currently uses the local storage adapter. Multiple app servers need shared
media storage, and each Next.js instance otherwise maintains its own image cache.
A CDN can reuse public media across visitors and reduce origin traffic; it must
include query parameters in image cache keys and respect `Vary: Accept` for
optimized images. No CDN or production hosting changes are activated by these
repository changes.
