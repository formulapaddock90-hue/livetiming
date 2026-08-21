param(
    [string]$FtpHost = "ftp.formulapaddock.it",
    [string]$RemoteDir = "www.formulapaddock.it",
    [switch]$NoSsl
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$siteDir = Join-Path $repoRoot "site"
$liveHtml = Join-Path $siteDir "live.html"
$liveDataPhp = Join-Path $siteDir "live-data.php"

if (-not (Test-Path $liveHtml) -or -not (Test-Path $liveDataPhp)) {
    throw "File site/live.html o site/live-data.php mancanti. Esegui prima git pull."
}

$user = Read-Host "Username FTP Aruba"
$securePassword = Read-Host "Password FTP Aruba" -AsSecureString
$credential = [System.Net.NetworkCredential]::new($user, $securePassword)

$tokenBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($tokenBytes)
$token = [Convert]::ToBase64String($tokenBytes).TrimEnd('=').Replace('+','-').Replace('/','_')

$secretPath = Join-Path ([System.IO.Path]::GetTempPath()) "live-secret.php"
$secretContent = "<?php`n`$LIVE_DASH_TOKEN = '$token';`n"
[System.IO.File]::WriteAllText($secretPath, $secretContent, [System.Text.UTF8Encoding]::new($false))

function Send-FtpFile {
    param(
        [Parameter(Mandatory=$true)][string]$LocalPath,
        [Parameter(Mandatory=$true)][string]$RemoteName
    )

    $remoteDirClean = $RemoteDir.Trim('/')
    $uri = "ftp://$FtpHost/$remoteDirClean/$RemoteName"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.Credentials = $credential
    $request.UseBinary = $true
    $request.KeepAlive = $false
    $request.EnableSsl = -not $NoSsl

    $bytes = [System.IO.File]::ReadAllBytes($LocalPath)
    $request.ContentLength = $bytes.Length
    $stream = $request.GetRequestStream()
    try {
        $stream.Write($bytes, 0, $bytes.Length)
    }
    finally {
        $stream.Dispose()
    }

    $response = $request.GetResponse()
    try {
        Write-Host "OK $RemoteName - $($response.StatusDescription.Trim())"
    }
    finally {
        $response.Dispose()
    }
}

try {
    Send-FtpFile -LocalPath $liveHtml -RemoteName "live.html"
    Send-FtpFile -LocalPath $liveDataPhp -RemoteName "live-data.php"
    Send-FtpFile -LocalPath $secretPath -RemoteName "live-secret.php"

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
    if (Test-Path $secretPath) {
        Remove-Item $secretPath -Force
    }
}
