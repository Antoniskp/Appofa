const React = require('react');

function NextImageMock({ src, alt, unoptimized: _unoptimized, ...props }) {
  return React.createElement('img', { src, alt, ...props });
}

module.exports = {
  __esModule: true,
  default: NextImageMock,
};
