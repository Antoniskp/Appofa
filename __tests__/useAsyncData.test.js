/** @jest-environment jsdom */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');
const { useAsyncData } = require('../hooks/useAsyncData');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

function HookHarness({ fetchFunction, onState }) {
  const state = useAsyncData(fetchFunction, [], {
    initialData: [],
    transform: (response) => response?.data || [],
  });

  React.useEffect(() => {
    onState(state);
  }, [onState, state]);

  return null;
}

describe('useAsyncData', () => {
  it('should export useAsyncData function', () => {
    expect(useAsyncData).toBeDefined();
    expect(typeof useAsyncData).toBe('function');
  });

  it('should discard stale fetch results after external setData', async () => {
    const deferred = createDeferred();
    const fetchFunction = jest.fn(() => deferred.promise);
    let latestState;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(HookHarness, {
        fetchFunction,
        onState: (state) => { latestState = state; },
      }));
      await flushPromises();
    });

    await act(async () => {
      latestState.setData([{ id: 'new-slide' }]);
      await flushPromises();
    });

    await act(async () => {
      deferred.resolve({ data: [{ id: 'old-slide' }] });
      await flushPromises();
    });

    expect(latestState.data).toEqual([{ id: 'new-slide' }]);
    expect(fetchFunction).toHaveBeenCalledTimes(1);

    await act(async () => {
      root.unmount();
      await flushPromises();
    });
    container.remove();
  });

  it('should discard older refetch response when a newer refetch resolves first', async () => {
    const firstDeferred = createDeferred();
    const secondDeferred = createDeferred();
    const fetchFunction = jest
      .fn()
      .mockImplementationOnce(() => firstDeferred.promise)
      .mockImplementationOnce(() => secondDeferred.promise);
    let latestState;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(HookHarness, {
        fetchFunction,
        onState: (state) => { latestState = state; },
      }));
      await flushPromises();
    });

    await act(async () => {
      latestState.refetch();
      await flushPromises();
    });

    await act(async () => {
      secondDeferred.resolve({ data: [{ id: 'latest' }] });
      await flushPromises();
    });

    await act(async () => {
      firstDeferred.resolve({ data: [{ id: 'stale' }] });
      await flushPromises();
    });

    expect(latestState.data).toEqual([{ id: 'latest' }]);
    expect(fetchFunction).toHaveBeenCalledTimes(2);

    await act(async () => {
      root.unmount();
      await flushPromises();
    });
    container.remove();
  });
});
