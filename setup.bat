@echo off
REM Scavenger Mine Donation Tool Setup Script for Windows
REM This script sets up the environment for running the donation tool

echo ======================================
echo  Scavenger Mine Donation Tool Setup
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js version 16 or higher.
    echo         Visit: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% detected

REM Extract major version number (handles both single and double digit versions)
set NODE_VERSION_TEMP=%NODE_VERSION:~1%
for /f "tokens=1 delims=." %%a in ("%NODE_VERSION_TEMP%") do set NODE_MAJOR=%%a

echo Node.js major version: %NODE_MAJOR%
echo.

REM Check if Node.js version is 16 or higher
if %NODE_MAJOR% lss 16 (
    echo [ERROR] Node.js version 16 or higher is required. Current version: %NODE_VERSION%
    echo.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
echo ======================================
call npm install

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully
echo.

REM Check if donor_wallets.csv exists
if not exist donor_wallets.csv (
    echo Creating sample donor_wallets.csv file...
    
    REM Check if sample exists and copy it
    if exist donor_wallets_sample.csv (
        copy donor_wallets_sample.csv donor_wallets.csv >nul
        echo [OK] Created donor_wallets.csv from sample
        echo.
        echo [WARNING] IMPORTANT: Please edit donor_wallets.csv with your actual seed phrases and recipient addresses
    ) else (
        echo [ERROR] Sample CSV file not found. Please create donor_wallets.csv manually.
        echo         See README.md for the required format.
    )
) else (
    echo [OK] donor_wallets.csv already exists
)

echo.
echo ======================================
echo  Setup complete!
echo ======================================
echo.
echo To run the donation tool, use one of these commands:
echo   npm start
echo   node donator.js
echo.
echo Make sure to:
echo 1. Edit donor_wallets.csv with your actual data
echo 2. Ensure all donor addresses are registered with Scavenger Mine
echo 3. Have a stable internet connection
echo.
echo Results will be saved to: donation_results_[timestamp].xlsx
echo ======================================
echo.
pause