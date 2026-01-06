# Script om commit message te corrigeren
# Corrigeert "gemaamt" naar "gemaakt" in commit 48c0c4f

$commitHash = "48c0c4f"
$oldMessage = "prototype gemaamt samen met Cecilia van  Amsterdam"
$newMessage = "prototype gemaakt samen met Cecilia van Amsterdam"

Write-Host "🔄 Corrigeren commit message..." -ForegroundColor Yellow
Write-Host "Commit: $commitHash" -ForegroundColor Cyan
Write-Host "Van: $oldMessage" -ForegroundColor Red
Write-Host "Naar: $newMessage" -ForegroundColor Green
Write-Host ""

# Gebruik git filter-branch of rebase
# Eenvoudigste: interactive rebase met automatische edit

# Maak een temp script voor de editor
$editorScript = @"
`$file = `$args[0]
`$content = Get-Content `$file -Raw
`$content = `$content -replace 'pick $commitHash', 'reword $commitHash'
Set-Content `$file `$content
"@

$editorScriptPath = Join-Path $env:TEMP "git-editor.ps1"
Set-Content $editorScriptPath $editorScript

# Set editor
$env:GIT_EDITOR = "powershell -File $editorScriptPath"

# Start rebase
git rebase -i $commitHash^ 2>&1

# Als rebase start, wacht op editor voor commit message
# Dit is complex, dus gebruik een andere aanpak

Write-Host "Gebruik handmatig:" -ForegroundColor Yellow
Write-Host "git rebase -i $commitHash^" -ForegroundColor Cyan
Write-Host "Verander 'pick' naar 'reword' voor commit $commitHash" -ForegroundColor White
Write-Host "Sla op en sluit editor" -ForegroundColor White
Write-Host "Wijzig message naar: $newMessage" -ForegroundColor White




