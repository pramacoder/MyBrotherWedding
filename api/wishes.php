<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$file = __DIR__ . '/../wishes.json';

function readWishes($file) {
    if (file_exists($file)) {
        $raw = file_get_contents($file);
        $data = json_decode($raw, true);
        if (is_array($data)) return $data;
    }
    return [];
}

function writeWishes($file, $data) {
    @file_put_contents($file, json_encode(array_values($data), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode(readWishes($file), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');
    $body = json_decode($rawBody, true);
    if (!is_array($body)) $body = $_POST;

    $action = isset($_GET['action']) ? $_GET['action'] : (isset($body['action']) ? $body['action'] : '');
    $wishes = readWishes($file);

    if ($action === 'like') {
        $id = isset($_GET['id']) ? $_GET['id'] : (isset($body['id']) ? $body['id'] : '');
        foreach ($wishes as &$w) {
            if ((string)$w['id'] === (string)$id) {
                $w['likes'] = (isset($w['likes']) ? (int)$w['likes'] : 0) + 1;
                writeWishes($file, $wishes);
                echo json_encode($w, JSON_UNESCAPED_UNICODE);
                exit;
            }
        }
        echo json_encode(['success' => true]);
        exit;
    }

    $name = isset($body['name']) ? trim((string)$body['name']) : '';
    $attendance = isset($body['attendance']) ? trim((string)$body['attendance']) : 'hadir';
    $message = isset($body['message']) ? trim((string)$body['message']) : '';

    if ($name === '' || $message === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Nama dan ucapan wajib diisi']);
        exit;
    }

    $maxId = 0;
    foreach ($wishes as $w) {
        if (isset($w['id']) && is_numeric($w['id']) && (int)$w['id'] > $maxId) {
            $maxId = (int)$w['id'];
        }
    }

    $newWish = [
        'id' => $maxId + 1,
        'name' => $name,
        'attendance' => $attendance,
        'message' => $message,
        'likes' => 0,
        'createdAt' => date('c')
    ];

    array_unshift($wishes, $newWish);
    writeWishes($file, $wishes);
    http_response_code(201);
    echo json_encode($newWish, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (string)$_GET['id'] : '';
    $wishes = readWishes($file);
    $filtered = array_filter($wishes, function($w) use ($id) {
        return (string)$w['id'] !== $id;
    });
    writeWishes($file, $filtered);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
