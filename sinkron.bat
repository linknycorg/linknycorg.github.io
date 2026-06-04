@echo off
:loop
cls
echo ====================================================
echo   SISTEM OTOMATISASI GITHUB AKTIF - MEMANTAU FILE   
echo ====================================================
echo Memeriksa perubahan file di folder BERSIH...

git add .

rem Memeriksa apakah ada perubahan file baru untuk di-commit
git diff-index --quiet HEAD --
if %errorlevel% neq 0 (
    echo Menemukan perubahan file! Mengunggah otomatis ke GitHub...
    git commit -m "Auto-update file web: %date% %time%"
    git push origin main
    echo [SUKSES] File di GitHub berhasil diperbarui!
) else (
    echo [AMAN] Tidak ada perubahan file di laptop. Menunggu...
)

rem Skrip akan memeriksa ulang folder setiap 10 detik
timeout /t 10 > nul
goto loop
