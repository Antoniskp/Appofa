# App Scope

## Working Definition

Appofa is a civic technology platform for direct democratic participation. It helps citizens understand local and national public life, propose improvements, vote on civic questions, compare civic proposals with party positions, evaluate public commitments, and discover independent candidates or civic leaders without requiring party membership.

The product should stay practical: every feature should help people move from awareness to participation, and from participation to accountable public action.

## Mission

Build a trusted digital civic space where citizens can:

- surface local and national problems;
- propose and compare solutions;
- vote on questions, polls, priorities, and civic ideas;
- compare citizen proposals, candidate commitments, and party positions on the same civic matters;
- follow public figures, candidates, organizations, and locations;
- understand government roles, elections, and public responsibilities;
- support independent candidates through transparent profiles, manifests, endorsements, and community validation;
- search for the people most fit for a public role based on expertise, location, trust signals, record, and civic alignment.

## Primary Audiences

| Audience | Need |
| --- | --- |
| Citizens | Understand issues, vote, propose ideas, compare options, find fit candidates, follow locations, and hold representatives accountable. |
| Independent candidates | Present identity, positions, manifest, endorsements, location ties, civic fit, and public activity without party infrastructure. |
| Civic groups and organizations | Publish proposals, coordinate supporters, and show transparent civic work. |
| Moderators and local stewards | Keep local information accurate, civil, and useful. |
| Journalists and researchers | Explore structured public data, candidate records, public questions, and community sentiment. |

## Product Principles

1. **Civic usefulness first**: avoid features that create engagement without public value.
2. **Local by default**: most actions should be connected to a country, prefecture, municipality, district, or other civic geography.
3. **Transparent identity where it matters**: voting rules, endorsements, candidate claims, and moderation actions should be understandable.
4. **Independent but not anti-party**: support independent candidates and civic movements while still representing parties, officials, and institutions accurately.
5. **Pluralism and fair access**: do not design the platform around one ideology, party, candidate, or campaign.
6. **Accountability over virality**: prioritize durable records, manifests, public commitments, and follow-up over short-lived attention.
7. **Privacy-aware participation**: support safe participation while preventing manipulation, spam, and fake civic signals.

## Core Feature Pillars

### 1. Civic Questions and Polls

Citizens should be able to vote on practical public questions, local priorities, and policy options. Polls and civic questions should support clear scope, location, eligibility rules, results, and auditability.

### 2. Suggestions and Solutions

Citizens should be able to submit problems, suggest solutions, and vote on what deserves attention. This should become a structured civic backlog for each location.

### 3. Civic Comparison

Citizens should be able to compare what different actors propose for the same civic matter:

- citizen suggestions and solutions;
- poll and civic question results;
- independent candidate commitments;
- party positions and official programs;
- organization proposals;
- public official actions or promises where available.

Comparisons should be structured by issue, location, election, office, and policy area. The goal is to make differences visible without forcing the platform to decide which option is correct.

### 4. People Search and Candidate Matching

The platform should include a people search engine for finding the fittest candidates or civic leaders for a role, location, or issue.

Search and matching should support:

- location, electoral district, and office filters;
- profession, expertise, education, and public-service experience;
- policy interests and issue alignment;
- independent, party-affiliated, nonpartisan, and unknown affiliation filters;
- verification, claim status, endorsements, badges, and trust signals;
- manifest commitments and answers to civic questions;
- public activity such as articles, videos, suggestions, polls, and comments;
- comparison between people who are relevant to the same role or civic problem.

Matching should explain why a person appears in results. It should not be a black-box popularity ranking.

### 5. Independent Candidate Profiles

Candidate pages should clearly show:

- identity and verification or claim status;
- location and electoral district;
- professional background and expertise;
- political affiliation status, including independent status;
- manifest or commitments;
- endorsements and relationships;
- public answers, articles, videos, and civic activity;
- match reasons for relevant offices, locations, or issues;
- removal or correction process for inaccurate data.

### 6. Manifests and Commitments

Manifests should become structured promises, not just text pages. A strong manifest feature should allow citizens to compare commitments, follow progress, and connect promises to locations, policy areas, and public offices.

### 7. Location-Based Civic Knowledge

Each location should act as a civic home page with relevant polls, suggestions, elections, officials, candidates, organizations, party proposals, sections, maps, and public-service information.

### 8. Public Figures, Officials, Parties, and Organizations

The platform should map people and organizations involved in public life, including elected officials, candidates, civic groups, parties, movements, and local organizations. Parties should be represented through structured positions and programs so citizens can compare them with independent candidates and community proposals.

### 9. Trust, Moderation, and Verification

The system needs clear trust mechanics:

- verified badges and claim flows;
- public correction and removal requests;
- moderation roles by location;
- report handling;
- rate limits and anti-abuse controls;
- visibility rules for anonymous or hidden participation.

## Independent Candidate Support

The platform should help independent candidates compete on clarity and trust, not advertising budget.

Important candidate-facing capabilities:

- profile claiming and verification;
- candidate status and electoral district;
- structured manifest builder;
- public Q&A;
- endorsements from citizens, organizations, and public figures;
- issue tags and policy areas;
- fit and comparison signals for relevant offices, districts, and civic issues;
- campaign updates through articles, videos, or official posts;
- transparent funding or support notes where legally appropriate;
- comparison against other candidates in the same race.

Important boundaries:

- The platform should not secretly favor any candidate.
- Paid promotion, if ever added, must be visibly labeled and governed by strict rules.
- Candidate data should separate verified facts, self-declared claims, public records, and community input.
- Political persuasion tools should be transparent and avoid manipulation.
- Candidate matching should explain criteria and avoid pretending that popularity alone means fitness.

## Civic Matter Comparison

For each important civic matter, the app should try to connect:

- the original problem or question;
- citizen suggestions and proposed solutions;
- poll results or civic question votes;
- candidate commitments;
- party proposals;
- organization positions;
- related articles, videos, and official posts;
- location and election context.

This allows a citizen to ask: "What do people want, what do candidates promise, and what do parties propose?"

The comparison model should separate:

- public opinion;
- expert or community suggestions;
- candidate promises;
- party programs;
- official records;
- platform editorial or moderation notes.

## Current Product Surface

The codebase already contains foundations for this scope:

- articles, news, and videos;
- polls and civic questions;
- suggestions and solution voting;
- locations, electoral districts, and maps;
- public person and candidate pages;
- organizations and political affiliation;
- political parties and political affiliation status;
- manifests and manifest supporters;
- endorsements;
- reports, removal requests, moderation, and admin tools;
- notifications, messaging, newsletters, and user profiles.

## Near-Term Product Direction

Recommended next priorities:

1. Make independent candidate pages the clearest public object in the app.
2. Build people search and candidate matching around location, office, expertise, trust signals, manifest commitments, and issue alignment.
3. Connect candidate pages to manifest commitments, endorsements, civic questions, suggestions, party comparisons, and locations.
4. Turn location pages into civic dashboards for local problems, polls, suggestions, candidates, officials, parties, and organizations.
5. Add comparison pages for major civic matters: citizen proposals, poll results, party positions, and candidate commitments.
6. Improve trust labels: verified, claimed, self-declared, community-submitted, official record.
7. Add a public product page that explains the platform scope in citizen-friendly language once this document is stable.

## Open Decisions

- Which countries and election types are first-class launch targets?
- Should citizens be allowed to create candidate profiles, or only admins/moderators?
- What qualifies someone as an independent candidate?
- What signals should count when ranking or matching the "fittest" candidates?
- How should party positions be collected, verified, versioned, and compared?
- Should users be able to compare their own poll answers against candidates and parties?
- Which participation actions require real identity, verified email, location proof, or no verification?
- Should voting results be public immediately, after closing, or configurable by poll type?
- How should the app handle legally sensitive election-period rules?
- What public data sources should be treated as authoritative?

## Development Rule

When adding or changing features, ask:

1. Does this increase meaningful civic participation?
2. Does it improve transparency or accountability?
3. Does it help citizens, independent candidates, or local communities act more effectively?
4. Can it be abused politically, and have we designed appropriate safeguards?

If the answer is unclear, update this scope before building the feature.
