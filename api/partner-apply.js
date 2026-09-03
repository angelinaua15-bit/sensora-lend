module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const name = (body.name || '').toString().trim();
  const company = (body.company || '').toString().trim();
  const email = (body.email || '').toString().trim();
  const audience = (body.audience || '').toString().trim();
  const message = (body.message || '').toString().trim();
  const website = (body.website || '').toString().trim(); // honeypot field

  if (website) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!name || !company || !email) {
    res.status(400).json({ error: 'Missing required fields (name, company, email)' });
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('partner-apply: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not set');
    res.status(500).json({ error: 'Server is not configured' });
    return;
  }

  const text = [
    '🤝 New partner application — Sensora',
    '',
    `Name: ${name}`,
    `Company / platform: ${company}`,
    `Email: ${email}`,
    `Audience & reach: ${audience || '—'}`,
    '',
    'Message:',
    message || '—',
  ].join('\n');

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await tgRes.json();
    if (!data.ok) {
      console.error('Telegram API error', data);
      res.status(502).json({ error: 'Failed to deliver message' });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('partner-apply: unexpected error', err);
    res.status(500).json({ error: 'Unexpected error' });
  }
};
