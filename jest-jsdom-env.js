/**
 * Custom jsdom test environment that polyfills ModuleMocker.clearMocksOnScope.
 *
 * jest-runtime@30.4.x calls moduleMocker.clearMocksOnScope() during
 * Runtime.resetModules(), but jest-mock@30.3.x does not have this method yet.
 * Adding a no-op polyfill here (before the Runtime is constructed) prevents
 * the "clearMocksOnScope is not a function" crash in every @jest-environment
 * jsdom test suite.
 */
const JsdomEnvironment = require('jest-environment-jsdom').TestEnvironment;
const jestMock = require('jest-mock');

if (typeof jestMock.ModuleMocker.prototype.clearMocksOnScope !== 'function') {
  // The `_global` parameter is intentionally accepted to match the function
  // signature expected by jest-runtime (which passes `this._environment.global`
  // when calling clearMocksOnScope). The no-op body is safe here because
  // jest-mock 30.3.x never tracked per-scope mocks; clearing them is a no-op.
  // eslint-disable-next-line no-unused-vars
  jestMock.ModuleMocker.prototype.clearMocksOnScope = function clearMocksOnScope(_global) {};
}

module.exports = JsdomEnvironment;
