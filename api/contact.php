<?php
declare(strict_types=1);

// This endpoint is intended to run on the PETLab web server, not in a browser.
const RECIPIENT = 'petlab@hust.edu.cn';

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

if ($name === '' || $details === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    exit('Please provide a valid name, email address, and inquiry.');
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

// Use the visitor's email as the sender so replies go directly to them.
$headers = implode("\r\n", [
    'From: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
]);

if (!mail(RECIPIENT, $subject, $message, $headers)) {
    http_response_code(500);
    exit('Unable to send the inquiry.');
}

// Determine redirect target based on referring page language
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$redirectPage = (strpos($referer, '-cn.html') !== false) ? 'Engage-inquiry-cn.html' : 'Engage-inquiry-en.html';

header('Location: ../Engage/' . $redirectPage . '?sent=1', true, 303);
exit;
