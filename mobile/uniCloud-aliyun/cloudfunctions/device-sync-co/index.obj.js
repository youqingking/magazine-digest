'use strict';

const DEVICE_SYNC_BOUNDARY = 'smoke_only not_production_path device-sync-co';

function getClientSnapshot(context) {
  return typeof context.getClientInfo === 'function' ? context.getClientInfo() || {} : {};
}

function decodeBase64Url(input) {
  let normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  if (padding) {
    normalized += '='.repeat(4 - padding);
  }
  return Buffer.from(normalized, 'base64').toString('utf8');
}

async function getAuthSnapshot(context) {
  const token = typeof context.getUniIdToken === 'function' ? context.getUniIdToken() : '';

  if (!token) {
    throw new Error('AUTH_UID_MISSING');
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    throw new Error('AUTH_UID_MISSING');
  }

  let payload;
  try {
    payload = JSON.parse(decodeBase64Url(segments[1]));
  } catch (error) {
    throw new Error('AUTH_UID_MISSING');
  }

  if (!payload || !payload.uid) {
    throw new Error('AUTH_UID_MISSING');
  }

  return {
    uid: payload.uid,
    exp: payload.exp || 0
  };
}

function buildDeviceSnapshot(context, pushClientId) {
  const {
    appId,
    deviceId,
    deviceBrand,
    deviceModel,
    osName,
    osVersion,
    osLanguage,
    osTheme,
    devicePixelRatio,
    windowWidth,
    windowHeight,
    screenWidth,
    screenHeight,
    romName,
    romVersion
  } = getClientSnapshot(context);

  return {
    appid: appId,
    device_id: deviceId,
    vendor: deviceBrand,
    model: deviceModel,
    uni_platform: context.getClientInfo ? getClientSnapshot(context).platform || context.clientPlatform : context.clientPlatform,
    os_name: osName,
    os_version: osVersion,
    os_language: osLanguage,
    os_theme: osTheme,
    pixel_ratio: devicePixelRatio,
    window_width: windowWidth,
    window_height: windowHeight,
    screen_width: screenWidth,
    screen_height: screenHeight,
    rom_name: romName,
    rom_version: romVersion,
    push_clientid: pushClientId || null
  };
}

async function upsertOpenDevice(context, pushClientId) {
  const db = uniCloud.database();
  const opendbDeviceCollection = db.collection('opendb-device');
  const snapshot = buildDeviceSnapshot(context, pushClientId);
  const now = Date.now();
  const existing = await opendbDeviceCollection.where({
    device_id: snapshot.device_id
  }).get();

  const payload = {
    ...snapshot,
    last_update_date: now
  };

  if (existing.data.length > 0) {
    await opendbDeviceCollection.where({
      device_id: snapshot.device_id
    }).update(payload);
    return payload;
  }

  await opendbDeviceCollection.add({
    ...payload,
    create_date: now
  });
  return payload;
}

async function upsertUniIdDevice(context, pushClientId) {
  const db = uniCloud.database();
  const deviceCollection = db.collection('uni-id-device');
  const { uid, exp } = await getAuthSnapshot(context);
  const { appId, deviceId } = getClientSnapshot(context);
  const tokenExpired = exp ? exp * 1000 : 0;

  const existing = await deviceCollection.where({
    device_id: deviceId
  }).get();

  const payload = {
    user_id: uid,
    device_id: deviceId,
    token_expired: tokenExpired,
    push_clientid: pushClientId || null,
    appid: appId
  };

  if (existing.data.length > 0) {
    await deviceCollection.where({
      device_id: deviceId
    }).update(payload);
    return payload;
  }

  await deviceCollection.add(payload);
  return payload;
}

async function verifyCurrentDeviceRecords(context) {
  const db = uniCloud.database();
  const opendbDeviceCollection = db.collection('opendb-device');
  const deviceCollection = db.collection('uni-id-device');
  const { uid } = await getAuthSnapshot(context);
  const { appId, deviceId } = getClientSnapshot(context);

  const [deviceResult, userDeviceResult] = await Promise.all([
    opendbDeviceCollection.where({
      device_id: deviceId
    }).orderBy('last_update_date', 'desc').limit(1).get(),
    deviceCollection.where({
      device_id: deviceId,
      user_id: uid
    }).limit(1).get()
  ]);

  const deviceRecord = deviceResult.data[0] || null;
  const userDeviceRecord = userDeviceResult.data[0] || null;

  return {
    errCode: 0,
    device_found: Boolean(deviceRecord),
    user_device_found: Boolean(userDeviceRecord),
    device_id: deviceId,
    push_clientid: deviceRecord?.push_clientid || userDeviceRecord?.push_clientid || null,
    appid: deviceRecord?.appid || userDeviceRecord?.appid || appId || null,
    updated_at: deviceRecord?.last_update_date || null,
    uid
  };
}

module.exports = {
  async registerDevice(params = {}) {
    const pushClientId = typeof params.pushClientId === 'string' ? params.pushClientId : '';
    const openDevice = await upsertOpenDevice(this, pushClientId);
    const uniIdDevice = await upsertUniIdDevice(this, pushClientId);

    return {
      errCode: 0,
      boundary_tag: DEVICE_SYNC_BOUNDARY,
      registration_state: 'registered',
      source: 'device-sync-co.registerDevice',
      device_id: openDevice.device_id,
      push_clientid: openDevice.push_clientid,
      appid: openDevice.appid,
      user_id: uniIdDevice.user_id,
      updated_at: new Date().toISOString()
    };
  },
  async verifyCurrentDeviceRecords() {
    return {
      ...(await verifyCurrentDeviceRecords(this)),
      boundary_tag: DEVICE_SYNC_BOUNDARY
    };
  }
};
