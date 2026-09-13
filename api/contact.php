<?php
declare(strict_types=1);

// This endpoint is intended to run on the PETLab web server, not in a browser.
const RECIPIENT = 'petlab@hust.edu.cn';
const SENDER = 'petlab@hust.edu.cn';

header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method Not Allowed');
}

// The hidden field is a simple honeypot for automated submissions.
if (trim((string)($_POST['url'] ?? '')) !== '') {
    http_response_code(400);
    exit('Invalid submission');
}

$name = trim((string)($_POST['name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$organization = trim((string)($_POST['organization_name'] ?? ''));
$title = trim((string)($_POST['title'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$details = trim((string)($_POST['inquiry_details'] ?? ''));

if (
    $name === ''
    || $details === ''
    || preg_match('/[\r\n]/', $name) === 1
    || preg_match('/[\r\n]/', $email) === 1
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || strlen($name) > 300
    || strlen($email) > 254
    || strlen($organization) > 600
    || strlen($title) > 300
    || strlen($phone) > 100
    || strlen($details) > 30000
) {
    http_response_code(400);
    exit('Please provide valid contact details and an inquiry within the allowed length.');
}

$subject = 'New PETLab inquiry';
$message = implode("\n", [
    'A new inquiry was submitted through the Digital PET Laboratory website.',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
    'Organization: ' . $organization,
    'Title: ' . $title,
    'Phone: ' . $phone,
    '',
    'Inquiry:',
    $details,
]);

// Keep the sender on this domain for SPF/DMARC alignment; replies still go to the visitor.
$headers = implode("\r\n", [
    'From: PETLab Website <' . SENDER . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
]);

if (!mail(RECIPIENT, $subject, $message, $headers)) {
    http_response_code(500);
    exit('Unable to send the inquiry.');
}

// Determine redirect target based on the referring page language.
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$redirectPage = (strpos($referer, '-cn.html') !== false) ? 'Engage-inquiry-cn.html' : 'Engage-inquiry-en.html';

header('Location: ../Engage/' . $redirectPage . '?sent=1', true, 303);
exit;
