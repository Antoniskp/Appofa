jest.mock('../src/services/notificationService', () => ({ countBroadcastRecipients: jest.fn() }));
const service = require('../src/services/notificationService');
const { previewBroadcast } = require('../src/controllers/notificationController');

describe('broadcast audience preview', () => {
  const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
  beforeEach(() => jest.clearAllMocks());
  test('counts the selected audience without sending', async () => {
    service.countBroadcastRecipients.mockResolvedValue(12);
    const res = response();
    await previewBroadcast({ query: { targetRole: 'moderator' } }, res);
    expect(service.countBroadcastRecipients).toHaveBeenCalledWith('moderator');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { count: 12 } });
  });
  test('rejects invalid audience values', async () => {
    const res = response();
    await previewBroadcast({ query: { targetRole: 'invalid' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(service.countBroadcastRecipients).not.toHaveBeenCalled();
  });
  test('does not present a failed count as zero recipients', async () => {
    service.countBroadcastRecipients.mockRejectedValue(new Error('DB unavailable'));
    const res = response();
    await previewBroadcast({ query: {} }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
