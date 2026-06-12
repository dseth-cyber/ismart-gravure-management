param(
  [switch]$Force
)

$secretsDir = Join-Path $PSScriptRoot ".." "secrets"

# Ensure secrets directory exists
if (-not (Test-Path -LiteralPath $secretsDir)) {
  New-Item -ItemType Directory -Path $secretsDir -Force | Out-Null
}

# Only generate if file doesn't exist or -Force is used
function Write-SecretFile {
  param([string]$Name, [string]$Content)
  $path = Join-Path $secretsDir "$Name.txt"
  if ((Test-Path -LiteralPath $path) -and -not $Force) {
    Write-Host "  [SKIP] $Name.txt already exists (use -Force to overwrite)"
  } else {
    Set-Content -Path $path -Value $Content -NoNewline
    Write-Host "  [OK]   $Name.txt generated"
  }
}

# Generate secrets
Write-Host "Generating development secrets..."

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
$useNode = $null
try { $useNode = Get-Command node -ErrorAction Stop } catch {}

if ($useNode) {
  $jwtSecret    = node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
  $jwtRefresh   = node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
  $dbPass       = node -e "process.stdout.write(require('crypto').randomBytes(16).toString('hex'))"
  $key1         = node -e "process.stdout.write('ig-' + require('crypto').randomBytes(20).toString('base64url'))"
  $key2         = node -e "process.stdout.write('ig-' + require('crypto').randomBytes(20).toString('base64url'))"
  $minioAccess  = node -e "process.stdout.write('minio-' + require('crypto').randomBytes(16).toString('base64url'))"
  $minioSecret  = node -e "process.stdout.write(require('crypto').randomBytes(24).toString('base64url'))"
} else {
  # Fallback: use .NET crypto (less secure but works without Node)
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  function Get-RandomHex([int]$bytes) {
    $buf = [byte[]]::new($bytes)
    $rng.GetBytes($buf)
    return [System.Convert]::ToHexString($buf).ToLower()
  }
  function Get-RandomBase64Url([int]$bytes) {
    $buf = [byte[]]::new($bytes)
    $rng.GetBytes($buf)
    return [System.Convert]::ToBase64String($buf).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  }
  $jwtSecret   = Get-RandomHex 32
  $jwtRefresh  = Get-RandomHex 32
  $dbPass      = Get-RandomHex 16
  $key1        = "ig-" + (Get-RandomBase64Url 20)
  $key2        = "ig-" + (Get-RandomBase64Url 20)
  $minioAccess = "minio-" + (Get-RandomBase64Url 16)
  $minioSecret = Get-RandomBase64Url 24
}

$dbUrl = "postgresql://gravure_user:$dbPass@postgres:5432/gravure_db?schema=public"

Write-SecretFile "jwt_secret"        $jwtSecret
Write-SecretFile "jwt_refresh_secret" $jwtRefresh
Write-SecretFile "db_password"       $dbPass
Write-SecretFile "db_url"           $dbUrl
Write-SecretFile "redis_url"        "redis://redis:6379"
Write-SecretFile "api_keys"         "$key1,$key2"
Write-SecretFile "minio_access_key"  $minioAccess
Write-SecretFile "minio_secret_key"  $minioSecret

Write-Host ""
Write-Host "Done! All secrets generated in $secretsDir"
Write-Host "Run 'docker compose up -d' to start."
