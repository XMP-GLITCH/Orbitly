// Simple Node.js/Express push notification server for Orbitly
// No sign-in required, stores subscriptions in memory (for demo)

const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());

// Generate your own VAPID keys with web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = 'BJsRBoGGGERh7H93YnhMDxluF0xk4SqxJqaUeooJZkybmLuPRzvUPwYoXdkagZK-g5xKjv7I-__vqjbmGWPoVoo';
const VAPID_PRIVATE_KEY = '5J0rq7GSmfdaIwMnmZWYPcBsK87CxQWBzQMGhxkfLko';

webpush.setVapidDetails(
  'mailto:orbitly@nowhere.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// In-memory store for subscriptions (for demo only)
const subscriptions = [];

// Endpoint to get VAPID public key
app.get('/vapidPublicKey', (req, res) => {
  res.send({ key: VAPID_PUBLIC_KEY });
});

// Endpoint to register a push subscription
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  // Avoid duplicates
  if (!subscriptions.find(s => s.endpoint === subscription.endpoint)) {
    subscriptions.push(subscription);
  }
  res.status(201).json({ message: 'Subscription registered' });
});

// Endpoint to trigger a push notification (called by reminders logic)
app.post('/notify', async (req, res) => {
  const { title, body, data } = req.body;
  const payload = JSON.stringify({ title, body, data });
  let success = 0;
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      success++;
    } catch (err) {
      // Remove invalid subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        const idx = subscriptions.findIndex(s => s.endpoint === sub.endpoint);
        if (idx !== -1) subscriptions.splice(idx, 1);
      }
    }
  }
  res.json({ sent: success, total: subscriptions.length });
});

app.listen(port, () => {
  console.log(`Push server running on port ${port}`);
});
