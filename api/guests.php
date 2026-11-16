<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$file = __DIR__ . '/../guests.json';

function readGuests($file) {
    if (file_exists($file)) {
        $raw = file_get_contents($file);
        $data = json_decode($raw, true);
        if (is_array($data)) return $data;
    }
    return [
        ['id' => 1, 'name' => 'Andi', 'slug' => 'andi', 'invitation' => 'Personal'],
        ['id' => 2, 'name' => 'Budi', 'slug' => 'budi', 'invitation' => 'Personal'],
        ['id' => 3, 'name' => 'Keluarga Besar', 'slug' => 'keluarga-besar', 'invitation' => 'Group'],
        ['id' => 4, 'name' => 'Teman Kampus', 'slug' => 'teman-kampus', 'invitation' => 'Group']
    ];
}

function writeGuests($file, $data) {
    @file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function makeSlug($text) {
    $s = strtolower(trim((string)$text));
    $s = preg_replace('/[^a-z0-9\s\-_]/', '', $s);
    $s = preg_replace('/[\s_]+/', '-', $s);
    $s = preg_replace('/-+/', '-', $s);
    return trim($s, '-');
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $guests = readGuests($file);
    $slug = isset($_GET['slug']) ? strtolower(trim($_GET['slug'])) : '';
    if ($slug !== '') {
        foreach ($guests as $g) {
            if (strtolower($g['slug']) === $slug) {
                echo json_encode($g, JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Guest not found', 'slug' => $slug]);
        exit;
    }
    echo json_encode($guests, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');
    $body = json_decode($rawBody, true);
    if (!is_array($body)) $body = $_POST;

    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $slug = isset($body['slug']) && trim((string)$body['slug']) !== ''
        ? makeSlug($body['slug'])
        : makeSlug($name);
    $invitation = (isset($body['invitation']) && $body['invitation'] === 'Group') ? 'Group' : 'Personal';

    if ($name === '' || $slug === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Nama dan slug wajib diisi']);
        exit;
    }

    $guests = readGuests($file);
    $found = false;
    $savedGuest = null;

    foreach ($guests as &$g) {
        if (strtolower($g['slug']) === $slug) {
            $g['name'] = $name;
            $g['invitation'] = $invitation;
            $savedGuest = $g;
            $found = true;
            break;
        }
    }
    unset($g);

    if (!$found) {
        $maxId = 0;
        foreach ($guests as $g) {
            if (isset($g['id']) && (int)$g['id'] > $maxId) {
                $maxId = (int)$g['id'];
            }
        }
        $savedGuest = [
            'id' => $maxId + 1,
            'name' => $name,
            'slug' => $slug,
            'invitation' => $invitation
        ];
        $guests[] = $savedGuest;
    }

    writeGuests($file, $guests);
    http_response_code(201);
    echo json_encode($savedGuest, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $guests = readGuests($file);
    $filtered = array_filter($guests, function($g) use ($id) {
        return (int)$g['id'] !== $id;
    });
    writeGuests($file, $filtered);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
