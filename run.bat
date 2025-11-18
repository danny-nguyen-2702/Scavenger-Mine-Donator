@echo off
REM Scavenger Mine Donation Tool Runner for Windows

echo ======================================
echo  Starting Scavenger Mine Donation Tool
echo ======================================
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo [WARNING] Dependencies not installed. Running setup first...
    echo.
    call setup.bat
    if %errorlevel% neq 0 (
        echo [ERROR] Setup failed. Please run setup.bat manually.
        pause
        exit /b 1
    )
)

REM Check if donor_wallets.csv exists
if not exist donor_wallets.csv (
    echo [ERROR] donor_wallets.csv not found!
    echo Please create donor_wallets.csv with your wallet information.
    echo See README.md for the required format.
    echo.
    pause
    exit /b 1
)

REM Run the donation tool
echo Starting donation process...
echo.
node donator.js

echo.
echo ======================================
echo  Process completed
echo ======================================
echo Check your Excel report for results.
echo.
pause