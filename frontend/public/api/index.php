<?php
/**
 * API Proxy for Bariatric Istanbul
 * This proxies requests from /api/* to the Python backend
 * Place this file at: /home/bariatrices/public_html/api/index.php
 */

// Backend URL (Python FastAPI running on port 8001)
$BACKEND_URL = 'http://127.0.0.1:8001';

// Get the request path
$requestUri = $_SERVER['REQUEST_URI'];

// Remove /api prefix if present and get the actual API path
$apiPath = preg_replace('/^\/api/', '', $requestUri);
if (empty($apiPath) || $apiPath === '/') {
    $apiPath = '/api/';
} elseif (strpos($apiPath, '/api') !== 0) {
    $apiPath = '/api' . $apiPath;
}

// Build the full backend URL
$url = $BACKEND_URL . $apiPath;

// Initialize cURL
$ch = curl_init();

// Set URL
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Forward headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host' && strtolower($name) !== 'content-length') {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Handle request body for POST, PUT, PATCH
if (in_array($method, ['POST', 'PUT', 'PATCH'])) {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Forward cookies
if (!empty($_COOKIE)) {
    $cookieString = '';
    foreach ($_COOKIE as $name => $value) {
        $cookieString .= "$name=$value; ";
    }
    curl_setopt($ch, CURLOPT_COOKIE, rtrim($cookieString, '; '));
}

// Capture response headers
$responseHeaders = [];
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$responseHeaders) {
    $len = strlen($header);
    $header = explode(':', $header, 2);
    if (count($header) < 2) return $len;
    
    $name = strtolower(trim($header[0]));
    $value = trim($header[1]);
    
    // Forward Set-Cookie headers
    if ($name === 'set-cookie') {
        header("Set-Cookie: $value", false);
    }
    
    $responseHeaders[$name] = $value;
    return $len;
});

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);

curl_close($ch);

// Handle errors
if ($error) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Backend unavailable', 'details' => $error]);
    exit;
}

// Set response headers
http_response_code($httpCode);
if ($contentType) {
    header("Content-Type: $contentType");
}

// Add CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle OPTIONS preflight
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Output response
echo $response;
