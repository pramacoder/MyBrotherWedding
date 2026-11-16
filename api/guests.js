const {
  getAllGuests,
  getGuestBySlug,
  createGuest,
  deleteGuest
} = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const slug = urlObj.searchParams.get('slug');
    const id = urlObj.searchParams.get('id');

    if (req.method === 'GET') {
      if (slug) {
        const guest = await getGuestBySlug(slug);
        if (!guest) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Guest not found', slug }));
        }
        res.statusCode = 200;
        return res.end(JSON.stringify(guest));
      }

      const guests = await getAllGuests();
      res.statusCode = 200;
      return res.end(JSON.stringify(guests));
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body !== null
        ? req.body
        : JSON.parse(req.rawBody || '{}');
      const created = await createGuest(body);
      res.statusCode = 201;
      return res.end(JSON.stringify(created));
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Parameter id diperlukan' }));
      }
      await deleteGuest(id);
      res.statusCode = 200;
      return res.end(JSON.stringify({ success: true }));
    }

    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
};
