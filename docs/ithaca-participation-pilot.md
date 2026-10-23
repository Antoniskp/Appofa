# Ithaca participation pilot

Selected starting point: the existing public proposal about improving Vathy's square, `/suggestions/5`, on the Ithaca community page. Recheck its title and visibility before publishing.

## First public update (draft)

Stage: discussion. Leave responsible body, response, cost, deadline and evidence blank until documented. Do not assign an official or volunteer without their agreement.

> Ξεκινάμε με τη συγκέντρωση συγκεκριμένων προτάσεων για την πλατεία του Βαθέως. Περιγράψτε ένα πρόβλημα, ποιον επηρεάζει και ποια βελτίωση προτείνετε. Όπου μπορείτε, προσθέστε φωτογραφία ή δημόσια πηγή χωρίς προσωπικά δεδομένα. Επόμενο βήμα είναι να ομαδοποιηθούν οι προτάσεις και να βρεθεί εθελοντής συντονιστής για τη συνέχεια. Δεν υπάρχει ακόμη επιβεβαιωμένη ανάληψη από τον δήμο, εγκεκριμένο έργο ή συμφωνημένο χρονοδιάγραμμα.

This draft describes the proposed discussion process, not completed municipal work. Publish through the proposal's existing progress editor using its current revision, only after verifying the page and that the discussion is open. Publishing starts the pilot; do not describe it as already launched before that succeeds.

## Operating sequence

1. Keep this one proposal as the discussion hub. Link it from the Ithaca page.
2. Invite participants to add concrete problems, accessible improvements and evidence; avoid creating several competing polls.
3. A willing coordinator summarizes distinct ideas, including disagreements, then publishes that summary as a dated progress update.
4. If a vote is useful, link one poll to the proposal, with clear options and limits. Do not describe the results as representative of all residents.
5. Record any submission to an authority only after it has actually been sent. Record replies, delivery milestones and completion only with supporting evidence.

## Measures

Review weekly: distinct contributors, repeat contributors, substantive proposals, and time since the last documented progress update. Do not count page views as participation. Keep the pilot open-ended until a coordinator agrees to a schedule.

## Software release notes

- Run the issue-follow migration before enabling the new API.
- Following is opt-in and account-scoped, for public non-organization proposals and polls.
- `/following` shows current state and proposal progress; it does not send email or push notifications. A digest is a separate opt-in feature, not implemented in this release.
- Article previews suppress narrowly recognized accidental authoring prompts and the editor warns about them. This does not rewrite stored articles. Review article 155 and replace its summary with an accurate neutral editorial summary after checking the full text.
- The homepage uses a static introduction. Existing admin-managed slides remain stored but no longer control the homepage hero.
