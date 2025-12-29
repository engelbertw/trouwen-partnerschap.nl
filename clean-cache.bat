@echo off
echo.
echo ========================================
echo   Next.js Cache Cleanup
echo ========================================
echo.

echo [1/4] Removing .next directory...
if exist .next (
    rmdir /s /q .next
    echo Done!
) else (
    echo Already clean.
)

echo.
echo [2/4] Removing node_modules/.cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Done!
) else (
    echo Already clean.
)

echo.
echo [3/4] Removing TypeScript cache...
if exist tsconfig.tsbuildinfo (
    del tsconfig.tsbuildinfo
    echo Done!
) else (
    echo Already clean.
)

echo.
echo [4/4] Cleaning up...
echo.
echo ========================================
echo   Cleanup Complete!
echo ========================================
echo.
echo Now restart your dev server:
echo   npm run dev
echo.

