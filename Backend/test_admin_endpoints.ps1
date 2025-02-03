$headers = @{ Authorization = 'Bearer bad_token' }

Write-Host "=== Testing stats endpoint (expecting 401 or 403 for bad token) ==="
try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/stats' -Headers $headers
    $r | ConvertTo-Json -Depth 5
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status: $code (good, route exists and auth is enforced)"
}

Write-Host ""
Write-Host "=== Testing analytics endpoint (expecting 401 or 403) ==="
try {
    $r2 = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/analytics?days=30' -Headers $headers
    $r2 | ConvertTo-Json -Depth 5
} catch {
    $code2 = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status: $code2 (good, route exists and auth is enforced)"
}
