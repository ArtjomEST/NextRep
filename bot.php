<?php
/**
 * Telegram Bot Webhook Handler for NextRep
 *
 * Handles POST updates from Telegram, processes /start command,
 * and sends welcome message with web app button.
 */

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

// Load environment variables (support .env if present)
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"'");
            if ($key !== '' && !array_key_exists($key, $_ENV)) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
            }
        }
    }
}

$botToken = getenv('BOT_TOKEN') ?: ($_ENV['BOT_TOKEN'] ?? null);
$webappUrl = getenv('NEXTREP_WEBAPP_URL') ?: ($_ENV['NEXTREP_WEBAPP_URL'] ?? null);

if (!$botToken || !$webappUrl) {
    error_log('NextRep bot: BOT_TOKEN or NEXTREP_WEBAPP_URL not set');
    http_response_code(200); // Return 200 to avoid Telegram retries
    exit;
}

$rawInput = file_get_contents('php://input');
if ($rawInput === false || $rawInput === '') {
    http_response_code(200);
    exit;
}

$update = json_decode($rawInput, true);
if (!is_array($update)) {
    http_response_code(200);
    exit;
}

// Ignore non-message updates (e.g. callback_query, edited_message, etc.)
$message = $update['message'] ?? null;
if (!$message || !is_array($message)) {
    http_response_code(200);
    exit;
}

$chatId = $message['chat']['id'] ?? null;
$text = trim($message['text'] ?? '');
$from = $message['from'] ?? [];
$firstName = $from['first_name'] ?? 'there';
$username = $from['username'] ?? null;

if ($chatId === null) {
    http_response_code(200);
    exit;
}

$isStart = (strpos($text, '/start') === 0);

function sendTelegramMessage(string $botToken, int $chatId, string $text, ?array $replyMarkup = null): void {
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $payload = [
        'chat_id' => $chatId,
        'text' => $text,
    ];
    if ($replyMarkup !== null) {
        $payload['reply_markup'] = json_encode($replyMarkup);
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    curl_exec($ch);
    curl_close($ch);
}

if ($isStart) {
    $welcomeText = "Hello, {$firstName}! 👋\n\n"
        . "Welcome to NextRep — your smart workout tracker and personal training assistant.\n\n"
        . "Track your workouts, build presets, monitor your progress, and stay consistent.\n\n"
        . "Tap the button below to open the app and start your next session.";

    $replyMarkup = [
        'inline_keyboard' => [
            [
                [
                    'text' => 'Open NextRep',
                    'web_app' => ['url' => $webappUrl],
                ],
            ],
        ],
    ];

    sendTelegramMessage($botToken, (int) $chatId, $welcomeText, $replyMarkup);
} else {
    sendTelegramMessage($botToken, (int) $chatId, 'Type /start to open NextRep.');
}

http_response_code(200);
