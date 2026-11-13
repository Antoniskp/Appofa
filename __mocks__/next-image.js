const React = require('react');

function NextImageMock({ src, alt, ...props }) {
  return React.createElement('img', { src, alt, ...props });
}

module.exports = {
  __esModule: true,
  default: NextImageMock,
};
