function shouldHideSuggestionAuthor(suggestion, viewer) {
  if (!suggestion?.hideCreator) return false;
  if (!viewer) return true;
  if (['admin', 'moderator'].includes(viewer.role)) return false;
  return viewer.id !== suggestion.authorId;
}

module.exports = {
  shouldHideSuggestionAuthor,
};
