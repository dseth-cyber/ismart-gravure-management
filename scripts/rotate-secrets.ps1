param(
  [switch]$WhatIf
)

$secretsDir = Join-Path $PSScriptRoot '..' 'secrets'

function New-RandomHex {
  param([int]$bytes = 32)
  $buf = [byte[]]::new($bytes)
  [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($buf)
  return -join ($buf | ForEach-Object { '{0:x2}' -f $_ })
}

function New-RandomPassword {
  param([int]$length = 32)
  $chars = [char[]]'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $buf = [byte[]]::new($length)
  $rng.GetBytes($buf)
  return -join ($buf | ForEach-Object { $chars[$_ % $chars.Length] })
}

function Write-Secret {
  param([string]$path, [string]$value)
  if ($WhatIf) {
    Write-Host "  [WHATIF] Would write $path"
  } else {
    Set-Content -Path $path -Value $value -NoNewline -Force
    Write-Host "  [OK] $path"
  }
}

Write-Host "=== Rotating Secrets ===" -ForegroundColor Cyan
Write-Host ""

# 1. Database password
$dbPass = New-RandomHex 16
Write-Host "Database password: $dbPass"
Write-Secret (Join-Path $secretsDir 'db_password.txt') $dbPass

# 2. Database URL (update with new password)
$dbUrl = "postgresql://gravure_user:${dbPass}@postgres:5432/gravure_db?schema=public"
Write-Secret (Join-Path $secretsDir 'db_url.txt') $dbUrl

# 3. Redis password
$redisPass = New-RandomPassword 32
Write-Host "Redis password: $redisPass"
Write-Secret (Join-Path $secretsDir 'redis_password.txt') $redisPass

# 4. Redis URL (update with new password)
$redisUrl = "redis://:${redisPass}@redis:6379"
Write-Secret (Join-Path $secretsDir 'redis_url.txt') $redisUrl

# 5. JWT secret (64 hex chars = 256-bit)
$jwtSecret = New-RandomHex 32
Write-Host "JWT secret: $jwtSecret"
Write-Secret (Join-Path $secretsDir 'jwt_secret.txt') $jwtSecret

# 6. JWT refresh secret (64 hex chars = 256-bit)
$jwtRefreshSecret = New-RandomHex 32
Write-Host "JWT refresh secret: $jwtRefreshSecret"
Write-Secret (Join-Path $secretsDir 'jwt_refresh_secret.txt') $jwtRefreshSecret

# 7. API keys (comma-separated, 2 keys)
$apiKey1 = "ig-$((New-RandomPassword 20))"
$apiKey2 = "ig-$((New-RandomPassword 20))"
Write-Host "API keys: $apiKey1, $apiKey2"
Write-Secret (Join-Path $secretsDir 'api_keys.txt') "$apiKey1,$apiKey2"

# 8. MinIO access key
$minioKey = "minio-$((New-RandomPassword 22))"
Write-Host "MinIO access key: $minioKey"
Write-Secret (Join-Path $secretsDir 'minio_access_key.txt') $minioKey

# 9. MinIO secret key
$minioSecret = New-RandomPassword 32
Write-Host "MinIO secret key: $minioSecret"
Write-Secret (Join-Path $secretsDir 'minio_secret_key.txt') $minioSecret

# 10. Grafana admin password
$grafanaPass = New-RandomPassword 32
Write-Host "Grafana admin password: $grafanaPass"
Write-Secret (Join-Path $secretsDir 'grafana_password.txt') $grafanaPass

Write-Host ""
Write-Host "=== Rotation Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  1. Restart the stack: docker compose down && docker compose up -d"
Write-Host "  2. Update backend/.env DATABASE_URL with the new db password"
Write-Host "  3. Update REDIS_URL in backend/.env with the new redis password"
Write-Host "  4. Update docker-compose.yml minio credentials if changed"
Write-Host "  5. All existing JWT tokens are now invalid (users must re-login)"
