const {
  getAllWishes,
  createWish,
  likeWish,
  deleteWish
} = require('./_db');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  try {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const id = urlObj.searchParams.get('id');
    const action = urlObj.searchParams.get('action');

    if (req.method === 'GET') {
      const wishes = await getAllWishes();
      res.statusCode = 200;
      return res.end(JSON.stringify(wishes));
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body !== null
        ? req.body
        : JSON.parse(req.rawBody || '{}');

      if (action === 'like' || body.action === 'like') {
        const updated = await likeWish(id || body.id);
        res.statusCode = 200;
        return res.end(JSON.stringify(updated || { success: true }));
      }

      const created = await createWish(body);
      res.statusCode = 201;
      return res.end(JSON.stringify(created));
    }

    if (req.method === 'DELETE') {
      if (!id) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Parameter id diperlukan' }));
      }
      await deleteWish(id);
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
