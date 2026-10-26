# Homepage checkpoint

Before the community-feed redesign, main was at `aa2ec850`.
The local Git tag `homepage-before-personal-feed-2026-10-26` preserves that version.

The redesign is made directly on main, with no runtime legacy switch or duplicate homepage.
To undo it after it is committed, revert the homepage redesign commit. This preserves later unrelated work.
The tag can also be used to inspect or restore the original files. No database migration is involved.
