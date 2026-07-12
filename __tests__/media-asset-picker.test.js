/** @jest-environment <rootDir>/jest-jsdom-env.js */

const React = require('react');
const { act } = require('react');
const { createRoot } = require('react-dom/client');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mockMediaAPI = {
  list: jest.fn(),
  upload: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  mediaAPI: mockMediaAPI,
}));

jest.mock('next/image', () => {
  const React = require('react');
  return ({ alt, unoptimized, ...props }) => React.createElement('img', { ...props, alt });
});

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function dispatchFileEvent(element, eventName, propertyName, file) {
  const event = new Event(eventName, { bubbles: true, cancelable: true });
  Object.defineProperty(event, propertyName, {
    value: { files: [file] },
  });
  element.dispatchEvent(event);
}

describe('MediaAssetPicker', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    mockMediaAPI.list.mockReset();
    mockMediaAPI.upload.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = '';
  });

  test('shows selected asset metadata and clears selection through parent callback', async () => {
    const MediaAssetPicker = require('../components/media/MediaAssetPicker').default;
    const onClear = jest.fn();

    mockMediaAPI.list.mockResolvedValue({
      success: true,
      media: [{
        id: 77,
        url: '/uploads/media/cover.webp',
        variants: { thumbnail: { url: '/uploads/media/cover-thumb.webp' } },
        originalName: 'cover.jpg',
        size: 4096,
        altText: 'Cover alt',
        caption: 'Cover caption',
        credit: 'Cover credit',
        uploadedBy: { username: 'editor' },
      }],
      quota: { usedBytes: 4096, totalBytes: 8192 },
    });

    await act(async () => {
      root.render(React.createElement(MediaAssetPicker, {
        canManageMedia: true,
        selectedAssetId: 77,
        onClear,
      }));
      await flushPromises();
    });

    expect(container.textContent).toContain('Selected media');
    expect(container.textContent).toContain('cover.jpg');
    expect(container.textContent).toContain('File size: 4KB');
    expect(container.textContent).toContain('Uploaded by: @editor');
    expect(container.textContent).toContain('Cover alt / Cover caption / Cover credit');

    await act(async () => {
      Array.from(container.querySelectorAll('button'))
        .find((button) => button.textContent === 'Clear selected media')
        .click();
    });

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  test('uploads image files from paste and drop events', async () => {
    const MediaAssetPicker = require('../components/media/MediaAssetPicker').default;
    const onSelect = jest.fn();

    mockMediaAPI.list.mockResolvedValue({
      success: true,
      media: [],
      quota: { usedBytes: 0, totalBytes: 8192 },
    });
    mockMediaAPI.upload.mockResolvedValue({
      success: true,
      media: {
        id: 88,
        url: '/uploads/media/uploaded.webp',
        variants: { thumbnail: { url: '/uploads/media/uploaded-thumb.webp' } },
        originalName: 'uploaded.png',
      },
      quota: { usedBytes: 1024, totalBytes: 8192 },
    });

    await act(async () => {
      root.render(React.createElement(MediaAssetPicker, {
        canManageMedia: true,
        onSelect,
        selectVariant: 'thumbnail',
        uploadFields: { usageType: 'shared', entityType: 'shared' },
      }));
      await flushPromises();
    });

    const picker = container.querySelector('[data-testid="media-asset-picker"]');
    const pastedFile = new File(['paste'], 'paste.png', { type: 'image/png' });

    await act(async () => {
      dispatchFileEvent(picker, 'paste', 'clipboardData', pastedFile);
      await flushPromises();
    });

    expect(mockMediaAPI.upload).toHaveBeenLastCalledWith(pastedFile, {
      usageType: 'shared',
      entityType: 'shared',
    });
    expect(onSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 88 }),
      '/uploads/media/uploaded-thumb.webp',
    );

    const droppedFile = new File(['drop'], 'drop.webp', { type: 'image/webp' });

    await act(async () => {
      dispatchFileEvent(picker, 'drop', 'dataTransfer', droppedFile);
      await flushPromises();
    });

    expect(mockMediaAPI.upload).toHaveBeenLastCalledWith(droppedFile, {
      usageType: 'shared',
      entityType: 'shared',
    });
    expect(mockMediaAPI.upload).toHaveBeenCalledTimes(2);
  });
});
