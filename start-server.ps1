# Simple HTTP Server for Firebase Testing
# Run this script to serve your files locally

$port = 8080
$path = Split-Path -Parent $MyInvocation.MyCommand.Path

# Open browser
Start-Process "http://localhost:$port/pages/forms.html"

# Start server
try {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    Write-Host "Server started at http://localhost:$port"
    Write-Host "Press Ctrl+C to stop"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/pages/forms.html" }

        $filePath = Join-Path $path $localPath.TrimStart("/")

        if (Test-Path $filePath -PathType Leaf) {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            $response.ContentType = switch ([IO.Path]::GetExtension($filePath)) {
                ".html" { "text/html" }
                ".css" { "text/css" }
                ".js" { "application/javascript" }
                default { "application/octet-stream" }
            }
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } else {
            $response.StatusCode = 404
            $notFound = "<h1>404 Not Found</h1><p>$filePath</p>"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($notFound)
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }

        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Server error: $_"
} finally {
    if ($listener) { $listener.Stop() }
}