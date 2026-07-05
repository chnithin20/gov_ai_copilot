
$appPath = "e:\govui\frontend\src\App.jsx"
$mainPath = "e:\govui\frontend\src\main.jsx"

# Read App.jsx
$appContent = [IO.File]::ReadAllText($appPath, [System.Text.Encoding]::UTF8)

# Update App.jsx
$appContent = $appContent -replace "import ParticleBackground from './components/ParticleBackground'", "import ParticleBackground from './components/ParticleBackground'`nimport LanguageSelector from './components/LanguageSelector'"
$appContent = $appContent -replace "<ParticleBackground />", "<ParticleBackground />`n      <LanguageSelector />"

# Write back
[IO.File]::WriteAllText($appPath, $appContent, [System.Text.Encoding]::UTF8)

Write-Host "Files updated successfully!"
  