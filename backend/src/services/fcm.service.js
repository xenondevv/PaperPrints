'use strict';

const admin = require('../config/firebase');
const { query } = require('../config/db');

/**
 * Get the FCM token for a user.
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
async function getUserFcmToken(userId) {
  const result = await query(
    'SELECT fcm_token FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.fcm_token || null;
}

/**
 * Send a push notification to a user via FCM.
 * @param {string} userId  - The target user's ID
 * @param {string} title   - Notification title
 * @param {string} body    - Notification body
 * @param {object} [data]  - Optional data payload
 */
async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const fcmToken = await getUserFcmToken(userId);
    if (!fcmToken) {
      console.log(`[FCM] No FCM token for user ${userId}, skipping push`);
      return;
    }

    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'order_updates',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`[FCM] Notification sent to user ${userId}: ${response}`);
  } catch (err) {
    // Don't throw — notification failure shouldn't break order flow
    console.error(`[FCM] Failed to send notification to user ${userId}:`, err.message);
  }
}

/**
 * Send notification when an order is accepted.
 */
async function notifyOrderAccepted(userId, orderId, estimatedTime) {
  const etaText = estimatedTime ? ` (est. ${estimatedTime} min)` : '';
  await sendPushNotification(
    userId,
    '✅ Order Accepted!',
    `Your order has been accepted by the vendor${etaText}. We'll notify you when it's ready for pickup.`,
    { orderId, type: 'ORDER_ACCEPTED' }
  );
}

/**
 * Send notification when an order is ready for pickup.
 */
async function notifyOrderReady(userId, orderId) {
  await sendPushNotification(
    userId,
    '📦 Order Ready for Pickup!',
    'Your printout is ready! Head to the shop to collect it.',
    { orderId, type: 'ORDER_READY' }
  );
}

/**
 * Send notification when an order is rejected.
 */
async function notifyOrderRejected(userId, orderId) {
  await sendPushNotification(
    userId,
    '❌ Order Rejected',
    'Unfortunately, the vendor was unable to accept your order. Please try another shop.',
    { orderId, type: 'ORDER_REJECTED' }
  );
}

module.exports = {
  sendPushNotification,
  notifyOrderAccepted,
  notifyOrderReady,
  notifyOrderRejected,
};
