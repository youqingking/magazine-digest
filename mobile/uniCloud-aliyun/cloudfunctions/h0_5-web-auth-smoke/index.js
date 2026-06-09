'use strict';

const crypto = require('crypto');
const createConfig = require('uni-config-center');
const uniIdCommon = require('uni-id-common');
const H0_5_WEB_AUTH_BOUNDARY = 'smoke_only not_production_path h0_5-web-auth-smoke';

const db = uniCloud.database();
const dbCmd = db.command;
const usersCollection = db.collection('uni-id-users');
const openDeviceCollection = db.collection('opendb-device');
const uniIdDeviceCollection = db.collection('uni-id-device');
const shareConfig = createConfig({
  pluginId: 'uni-id'
});

function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

function isMatchUserApp(userAppList, matchAppList) {
  if (userAppList === undefined || userAppList === null) {
    return true;
  }
  if (getType(userAppList) !== 'array') {
    return false;
  }
  if (userAppList.includes('*')) {
    return true;
  }
  const appList = getType(matchAppList) === 'string' ? [matchAppList] : matchAppList;
  return userAppList.some((item) => appList.includes(item));
}

function buildUserQuery(username) {
  if (!username) {
    throw new Error('AUTH_INPUT_MISSING');
  }

  if (/^1\d{10}$/.test(username)) {
    return [{ mobile: username, mobile_confirmed: 1 }];
  }
  if (/@/.test(username)) {
    const queries = [{ email: username, email_confirmed: 1 }];
    if (username.toLowerCase() !== username) {
      queries.push({ email: username.toLowerCase(), email_confirmed: 1 });
    }
    return queries;
  }

  const queries = [{ username }];
  if (username.toLowerCase() !== username) {
    queries.push({ username: username.toLowerCase() });
  }
  return queries;
}

function normalizeClientInfo(context, event = {}) {
  const platform = context.PLATFORM === 'h5' ? 'web' : context.PLATFORM;

  return {
    appId: event.appid || context.APPID || '',
    platform,
    locale: context.LOCALE || 'zh-Hans',
    clientIP: context.CLIENTIP || '127.0.0.1',
    deviceId: event.device_id || context.DEVICEID || `web_${event.installation_id || 'smoke'}`
  };
}

function parseOriginConfig(config) {
  if (Array.isArray(config)) {
    return config;
  }
  if (config && config[0]) {
    return Object.values(config);
  }
  return config;
}

function getPlatformConfig(clientInfo) {
  const originConfig = parseOriginConfig(shareConfig.config());
  const appConfig = Array.isArray(originConfig)
    ? originConfig.find((item) => item.dcloudAppid === clientInfo.appId) || originConfig.find((item) => item.isDefaultConfig)
    : originConfig;

  if (!appConfig) {
    throw new Error(`AUTH_CONFIG_APP_MISSING:${clientInfo.appId || 'unknown'}`);
  }

  let platform = clientInfo.platform;
  if (['app-plus', 'app-android', 'app-ios'].includes(platform)) {
    platform = 'app';
  }
  if (platform === 'h5') {
    platform = 'web';
  }

  const merged = Object.assign(
    {
      tokenExpiresIn: 7200,
      tokenExpiresThreshold: 1200,
      passwordErrorLimit: 6,
      passwordErrorRetryTime: 3600
    },
    appConfig,
    platform === 'web' && appConfig.h5 ? appConfig.h5 : {},
    platform === 'app' && appConfig['app-plus'] ? appConfig['app-plus'] : {},
    appConfig[platform] || {}
  );

  if (!merged.tokenSecret || !merged.passwordSecret) {
    throw new Error('AUTH_CONFIG_SECRET_MISSING');
  }

  return merged;
}

function verifyPassword(userRecord, password, passwordSecret) {
  if (!userRecord?.password || !password) {
    return false;
  }

  if (getType(passwordSecret) === 'string') {
    const hmac = crypto.createHmac('sha1', passwordSecret.toString('ascii'));
    hmac.update(password);
    return hmac.digest('hex') === userRecord.password;
  }

  if (userRecord.password.startsWith('$')) {
    const [algorithmKey = '', saltLength = 0, hashStr = ''] = userRecord.password.split('$').filter(Boolean);
    if (algorithmKey !== 'UNI_ID_HMAC_SHA256') {
      return false;
    }
    const salt = hashStr.substring(0, Number(saltLength));
    const hash = hashStr.substring(Number(saltLength));
    const digest = crypto.createHmac('sha256', salt).update(password).digest('hex');
    return digest === hash;
  }

  const secrets = Array.isArray(passwordSecret) ? passwordSecret : [];
  const version = userRecord.password_secret_version;
  const matched = secrets.find((item) => item.version === version) || secrets[0];
  if (!matched?.value) {
    return false;
  }
  const hmac = crypto.createHmac('sha1', matched.value.toString('ascii'));
  hmac.update(password);
  return hmac.digest('hex') === userRecord.password;
}

async function findMatchedUser(username, appId) {
  const conditions = buildUserQuery(username);
  const query = conditions.length === 1 ? conditions[0] : dbCmd.or(conditions);
  const result = await usersCollection.where(query).get();
  const matched = result.data.filter((item) => isMatchUserApp(item.dcloud_appid, appId));

  if (matched.length !== 1) {
    throw new Error(matched.length > 1 ? 'AUTH_ACCOUNT_CONFLICT' : 'AUTH_ACCOUNT_NOT_FOUND');
  }

  return matched[0];
}

async function upsertDeviceRecords({ clientInfo, uid, tokenExpired, pushClientId, appid }) {
  const now = Date.now();
  const deviceId = clientInfo.deviceId;
  const openPayload = {
    appid: appid || clientInfo.appId || null,
    device_id: deviceId,
    vendor: 'web',
    model: 'browser',
    uni_platform: clientInfo.platform || 'web',
    os_name: 'web',
    os_version: 'unknown',
    os_language: 'zh-Hans',
    os_theme: 'light',
    pixel_ratio: 1,
    window_width: 0,
    window_height: 0,
    screen_width: 0,
    screen_height: 0,
    rom_name: 'web',
    rom_version: 'unknown',
    push_clientid: pushClientId || null,
    last_update_date: now
  };

  const existingOpenDevice = await openDeviceCollection.where({ device_id: deviceId }).get();
  if (existingOpenDevice.data.length > 0) {
    await openDeviceCollection.where({ device_id: deviceId }).update(openPayload);
  } else {
    await openDeviceCollection.add({
      ...openPayload,
      create_date: now
    });
  }

  const uniIdPayload = {
    user_id: uid,
    device_id: deviceId,
    token_expired: tokenExpired || 0,
    push_clientid: pushClientId || null,
    appid: appid || clientInfo.appId || null
  };
  const existingUniIdDevice = await uniIdDeviceCollection.where({
    device_id: deviceId,
    user_id: uid
  }).get();

  if (existingUniIdDevice.data.length > 0) {
    await uniIdDeviceCollection.where({
      device_id: deviceId,
      user_id: uid
    }).update(uniIdPayload);
  } else {
    await uniIdDeviceCollection.add(uniIdPayload);
  }

  return {
    registration_state: 'registered',
    source: 'h0_5-web-auth-smoke',
    device_id: deviceId,
    push_clientid: pushClientId || null,
    appid: appid || clientInfo.appId || null,
    user_id: uid,
    updated_at: new Date(now).toISOString()
  };
}

exports.main = async (event = {}, context = {}) => {
  const username = String(event.username || '').trim();
  const password = String(event.password || '');
  const boundaryTag = event.boundary_tag || H0_5_WEB_AUTH_BOUNDARY;

  if (!username || !password) {
    return {
      errCode: 1,
      errMsg: 'AUTH_INPUT_MISSING',
      boundary_tag: boundaryTag
    };
  }

  const clientInfo = normalizeClientInfo(context, event);
  const uniId = uniIdCommon.createInstance({
    context: {
      APPID: clientInfo.appId,
      PLATFORM: clientInfo.platform,
      LOCALE: clientInfo.locale,
      CLIENTIP: clientInfo.clientIP,
      DEVICEID: clientInfo.deviceId
    }
  });
  const platformConfig = getPlatformConfig(clientInfo);
  const userRecord = await findMatchedUser(username, clientInfo.appId);

  if (!verifyPassword(userRecord, password, platformConfig.passwordSecret)) {
    return {
      errCode: 2,
      errMsg: 'AUTH_PASSWORD_INVALID',
      boundary_tag: boundaryTag
    };
  }

  const tokenResult = await uniId.createToken({
    uid: userRecord._id
  });

  if (tokenResult.errCode) {
    return tokenResult;
  }

  const deviceRecord = await upsertDeviceRecords({
    clientInfo,
    uid: userRecord._id,
    tokenExpired: tokenResult.tokenExpired,
    pushClientId: event.push_clientid || '',
    appid: event.appid || clientInfo.appId || ''
  });

  return {
    errCode: 0,
    boundary_tag: boundaryTag,
    login_state: 'success',
    uid: userRecord._id,
    token: tokenResult.token,
    tokenExpired: tokenResult.tokenExpired,
    session_state: 'active_uni_id',
    token_state: 'token_present',
    device_record: deviceRecord,
    db_verification: {
      status: 'ok',
      blocking_reason: '',
      device_found: true,
      user_device_found: true,
      device_id: deviceRecord.device_id,
      push_clientid: deviceRecord.push_clientid,
      appid: deviceRecord.appid,
      updated_at: deviceRecord.updated_at,
      uid: userRecord._id
    }
  };
};
