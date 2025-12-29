# Fix params.id in all ceremonie pages
$files = @(
    "src/app/dossier/[id]/ceremonie/ambtenaar/page.tsx",
    "src/app/dossier/[id]/ceremonie/soort/page.tsx",
    "src/app/dossier/[id]/ceremonie/datum/page.tsx",
    "src/app/dossier/[id]/ceremonie/locatie/page.tsx",
    "src/app/dossier/[id]/ceremonie/ambtenaar/kiezen/page.tsx",
    "src/app/dossier/[id]/ceremonie/samenvatting/page.tsx",
    "src/app/dossier/[id]/ceremonie/wensen/page.tsx",
    "src/app/dossier/[id]/ceremonie/keuze/page.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Add const dossierId = params.id as string; after const router line
        $content = $content -replace '(const router = useRouter\(\);)', '$1`n  const dossierId = params.id as string;'
        
        # Replace all params.id with dossierId
        $content = $content -replace 'params\.id', 'dossierId'
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "Fixed: $file"
    } else {
        Write-Host "Not found: $file"
    }
}

Write-Host "Done!"

