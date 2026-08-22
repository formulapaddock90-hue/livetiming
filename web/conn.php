<?php
/**
 * Runtime configuration. Secrets must be supplied by the hosting environment;
 * never commit production credentials to this repository.
 */
function requiredEnv(string $name): string
{
    $value = getenv($name);
    if ($value === false || trim($value) === '') {
        throw new RuntimeException("Missing required environment variable: {$name}");
    }

    return $value;
}

$username = requiredEnv('FP_DB_USERNAME');
$dbname = requiredEnv('FP_DB_NAME');
$hostname = requiredEnv('FP_DB_HOST');
$password = requiredEnv('FP_DB_PASSWORD');
$host_ftp = requiredEnv('FP_FTP_HOST');
$user_ftp = requiredEnv('FP_FTP_USERNAME');
$pw_ftp = requiredEnv('FP_FTP_PASSWORD');
$root = getenv('FP_CLASSIFICA_ROOT') ?: 'classifica';
