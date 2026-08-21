param(
    [string]$FtpHost = "ftp.formulapaddock.it",
    [string]$RemoteDir = "www.formulapaddock.it",
    [int]$FtpPort = 990
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$siteDir = Join-Path $repoRoot "site"
$liveHtml = Join-Path $siteDir "live.html"
$liveDataPhp = Join-Path $siteDir "live-data.php"

if (-not (Test-Path $liveHtml) -or -not (Test-Path $liveDataPhp)) {
    throw "File site/live.html o site/live-data.php mancanti. Esegui prima git pull."
}

$curl = Get-Command curl.exe -ErrorAction SilentlyContinue
if (-not $curl) {
    throw "curl.exe non trovato. Su Windows 10/11 e PowerShell 7 dovrebbe essere gia disponibile."
}

$user = Read-Host "Username FTP Aruba"
$securePassword = Read-Host "Password FTP Aruba" -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password

$tokenBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($tokenBytes)
$token = [Convert]::ToBase64String($tokenBytes).TrimEnd('=').Replace('+','-').Replace('/','_')

$secretPath = Join-Path ([System.IO.Path]::GetTempPath()) "live-secret.php"
$secretContent = "<?php`n`$LIVE_DASH_TOKEN = '$token';`n"
[System.IO.File]::WriteAllText($secretPath, $secretContent, [System.Text.UTF8Encoding]::new($false))

function Send-FtpsFile {
    param(
        [Parameter(Mandatory=$true)][string]$LocalPath,
        [Parameter(Mandatory=$true)][string]$RemoteName
    )

    $remoteDirClean = $RemoteDir.Trim('/')
    $uri = "ftps://$FtpHost`:$FtpPort/$remoteDirClean/$RemoteName"

    # Aruba documents FTPS on port 990 and asks clients to accept the server
    # certificate. --insecure is scoped only to this known Aruba FTPS host;
    # transport remains TLS encrypted.
    & $curl.Source `
        --fail-with-body `
        --silent `
        --show-error `
        --connect-timeout 20 `
        --max-time 120 `
        --ftp-create-dirs `
        --ftp-pasv `
        --insecure `
        --user "$user`:$plainPassword" `
        --upload-file $LocalPath `
        $uri

    if ($LASTEXITCODE -ne 0) {
        throw "Upload FTPS fallito per $RemoteName (curl exit code $LASTEXITCODE)."
    }

    Write-Host "OK $RemoteName"
}

try {
    Write-Host "Connessione Aruba FTPS implicita: $FtpHost`:$FtpPort"

    Send-FtpsFile -LocalPath $liveHtml -RemoteName "live.html"
    Send-FtpsFile -LocalPath $liveDataPhp -RemoteName "live-data.php"
    Send-FtpsFile -LocalPath $secretPath -RemoteName "live-secret.php"

    [Environment]::SetEnvironmentVariable(
        "UNDERCUTF1_DashboardRelay__Token",
        $token,
        "User"
    )

    $env:UNDERCUTF1_DashboardRelay__Token = $token

    Write-Host ""
    Write-Host "Deploy completato."
    Write-Host "Token relay salvato come variabile utente UNDERCUTF1_DashboardRelay__Token."
    Write-Host "Riavvia UndercutF1 con --with-api per inviare la dashboard a FormulaPaddock."
    Write-Host "Pagina: https://www.formulapaddock.it/live.html"
}
finally {
    $plainPassword = $null
    $securePassword = $null

    if (Test-Path $secretPath) {
        Remove-Item $secretPath -Force
    }
}
