const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../data/hero-settings.json');

const DEFAULT_SETTINGS = {
  backgroundImageUrl: '',
  backgroundColor: '#1a2a3a',
};

function readSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(data) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
}

const getHeroSettings = (req, res) => {
  try {
    const settings = readSettings();
    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to read hero settings.' });
  }
};

const updateHeroSettings = (req, res) => {
  try {
    const { backgroundImageUrl, backgroundColor } = req.body;

    if (backgroundImageUrl !== undefined && typeof backgroundImageUrl !== 'string') {
      return res.status(400).json({ success: false, message: 'backgroundImageUrl must be a string.' });
    }
    if (backgroundImageUrl && backgroundImageUrl.trim() && !/^https?:\/\//i.test(backgroundImageUrl.trim())) {
      return res.status(400).json({ success: false, message: 'backgroundImageUrl must be a valid http or https URL.' });
    }
    if (backgroundColor !== undefined) {
      if (typeof backgroundColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(backgroundColor)) {
        return res.status(400).json({ success: false, message: 'backgroundColor must be a valid hex color (e.g. #1a2a3a).' });
      }
    }

    const current = readSettings();
    const updated = {
      backgroundImageUrl: backgroundImageUrl !== undefined ? backgroundImageUrl.trim() : current.backgroundImageUrl,
      backgroundColor: backgroundColor !== undefined ? backgroundColor : current.backgroundColor,
    };

    writeSettings(updated);
    return res.json({ success: true, data: updated, message: 'Hero settings updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update hero settings.' });
  }
};

module.exports = { getHeroSettings, updateHeroSettings };
