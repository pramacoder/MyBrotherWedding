const fs = require('fs');
const path = require('path');

const GUESTS_FILE = path.join(__dirname, '..', 'guests.json');
const WISHES_FILE = path.join(__dirname, '..', 'wishes.json');

let prisma = null;

function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  if (prisma) return prisma;
  try {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
    return prisma;
  } catch (err) {
    return null;
  }
}

function toSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function readJsonFile(filePath, defaultVal = []) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {}
  return defaultVal;
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

// ============================================================================
// GUESTS REPOSITORY (PostgreSQL via Prisma + JSON Fallback)
// ============================================================================
async function getAllGuests() {
  const db = getPrisma();
  if (db) {
    try {
      return await db.guest.findMany({ orderBy: { id: 'asc' } });
    } catch (e) {}
  }
  return readJsonFile(GUESTS_FILE, [
    { id: 1, name: 'Andi', slug: 'andi', invitation: 'Personal' },
    { id: 2, name: 'Budi', slug: 'budi', invitation: 'Personal' },
    { id: 3, name: 'Keluarga Besar', slug: 'keluarga-besar', invitation: 'Group' },
    { id: 4, name: 'Teman Kampus', slug: 'teman-kampus', invitation: 'Group' }
  ]);
}

async function getGuestBySlug(slug) {
  const cleanSlug = String(slug || '').toLowerCase().trim();
  if (!cleanSlug) return null;

  const db = getPrisma();
  if (db) {
    try {
      const found = await db.guest.findUnique({ where: { slug: cleanSlug } });
      if (found) return found;
    } catch (e) {}
  }

  const list = await getAllGuests();
  return list.find(g => String(g.slug).toLowerCase() === cleanSlug) || null;
}

async function createGuest({ name, slug, invitation }) {
  const cleanName = String(name || '').trim();
  const cleanSlug = toSlug(slug || cleanName);
  const cleanInv = invitation === 'Group' ? 'Group' : 'Personal';

  if (!cleanName || !cleanSlug) {
    throw new Error('Nama tamu dan slug wajib diisi.');
  }

  const db = getPrisma();
  if (db) {
    try {
      return await db.guest.upsert({
        where: { slug: cleanSlug },
        update: { name: cleanName, invitation: cleanInv },
        create: { name: cleanName, slug: cleanSlug, invitation: cleanInv }
      });
    } catch (e) {}
  }

  const list = await getAllGuests();
  const existingIdx = list.findIndex(g => String(g.slug).toLowerCase() === cleanSlug);
  if (existingIdx >= 0) {
    list[existingIdx].name = cleanName;
    list[existingIdx].invitation = cleanInv;
    writeJsonFile(GUESTS_FILE, list);
    return list[existingIdx];
  }

  const nextId = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const newGuest = {
    id: nextId,
    name: cleanName,
    slug: cleanSlug,
    invitation: cleanInv
  };
  list.push(newGuest);
  writeJsonFile(GUESTS_FILE, list);
  return newGuest;
}

async function deleteGuest(id) {
  const numId = Number(id);
  const db = getPrisma();
  if (db) {
    try {
      await db.guest.delete({ where: { id: numId } });
      return true;
    } catch (e) {}
  }

  const list = await getAllGuests();
  const filtered = list.filter(g => Number(g.id) !== numId);
  writeJsonFile(GUESTS_FILE, filtered);
  return true;
}

// ============================================================================
// WISHES & RSVP REPOSITORY (PostgreSQL via Prisma + JSON Fallback)
// ============================================================================
async function getAllWishes() {
  const db = getPrisma();
  if (db) {
    try {
      return await db.wish.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {}
  }
  return readJsonFile(WISHES_FILE, []);
}

async function createWish({ name, attendance, message }) {
  const cleanName = String(name || '').trim();
  const cleanAtt = ['hadir', 'tidak-hadir', 'ragu'].includes(attendance) ? attendance : 'hadir';
  const cleanMsg = String(message || '').trim();

  if (!cleanName || !cleanMsg) {
    throw new Error('Nama dan ucapan wajib diisi.');
  }

  const db = getPrisma();
  if (db) {
    try {
      return await db.wish.create({
        data: {
          name: cleanName,
          attendance: cleanAtt,
          message: cleanMsg,
          likes: 0
        }
      });
    } catch (e) {}
  }

  const list = await getAllWishes();
  const nextId = list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const newWish = {
    id: nextId,
    name: cleanName,
    attendance: cleanAtt,
    message: cleanMsg,
    likes: 0,
    createdAt: new Date().toISOString()
  };
  list.unshift(newWish);
  writeJsonFile(WISHES_FILE, list);
  return newWish;
}

async function likeWish(id) {
  const numId = Number(id);
  const db = getPrisma();
  if (db && !Number.isNaN(numId)) {
    try {
      return await db.wish.update({
        where: { id: numId },
        data: { likes: { increment: 1 } }
      });
    } catch (e) {}
  }

  const list = await getAllWishes();
  const item = list.find(w => String(w.id) === String(id));
  if (item) {
    item.likes = (Number(item.likes) || 0) + 1;
    writeJsonFile(WISHES_FILE, list);
    return item;
  }
  return null;
}

async function deleteWish(id) {
  const numId = Number(id);
  const db = getPrisma();
  if (db && !Number.isNaN(numId)) {
    try {
      await db.wish.delete({ where: { id: numId } });
      return true;
    } catch (e) {}
  }

  const list = await getAllWishes();
  const filtered = list.filter(w => String(w.id) !== String(id));
  writeJsonFile(WISHES_FILE, filtered);
  return true;
}

module.exports = {
  toSlug,
  getAllGuests,
  getGuestBySlug,
  createGuest,
  deleteGuest,
  getAllWishes,
  createWish,
  likeWish,
  deleteWish
};
