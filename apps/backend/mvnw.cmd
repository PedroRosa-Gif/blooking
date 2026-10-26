@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup script (Windows).
@REM
@REM Bootstraps Maven WITHOUT requiring a pre-installed Maven:
@REM   1. If "mvn" is already on PATH, it is used directly.
@REM   2. Otherwise the Maven distribution declared in
@REM      .mvn\wrapper\maven-wrapper.properties is downloaded (once) into the
@REM      user's Maven home and reused on subsequent runs.
@REM ----------------------------------------------------------------------------
@echo off
setlocal

@REM 1) Prefer an existing Maven on PATH.
where mvn >NUL 2>NUL
if %ERRORLEVEL%==0 (
  call mvn %*
  exit /b %ERRORLEVEL%
)

set "WRAPPER_PROPERTIES=%~dp0.mvn\wrapper\maven-wrapper.properties"
if not exist "%WRAPPER_PROPERTIES%" (
  echo Cannot find %WRAPPER_PROPERTIES%
  exit /b 1
)

@REM 2) Read distributionUrl from the properties file.
set "DISTRIBUTION_URL="
for /f "usebackq tokens=1,* delims==" %%A in ("%WRAPPER_PROPERTIES%") do (
  if "%%A"=="distributionUrl" set "DISTRIBUTION_URL=%%B"
)
if "%DISTRIBUTION_URL%"=="" (
  echo distributionUrl not set in %WRAPPER_PROPERTIES%
  exit /b 1
)

@REM Derive distribution name and target directories.
for %%I in ("%DISTRIBUTION_URL%") do set "ZIP_NAME=%%~nxI"
set "DIST_NAME=%ZIP_NAME:-bin.zip=%"
set "WRAPPER_DIR=%USERPROFILE%\.m2\wrapper\dists"
set "DIST_HOME=%WRAPPER_DIR%\%DIST_NAME%"
set "MVN_CMD=%DIST_HOME%\bin\mvn.cmd"

@REM 3) Download + unzip once if not present.
if not exist "%MVN_CMD%" (
  echo Downloading Maven from: %DISTRIBUTION_URL%
  if not exist "%WRAPPER_DIR%" mkdir "%WRAPPER_DIR%"
  set "TMP_ZIP=%WRAPPER_DIR%\%ZIP_NAME%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%DISTRIBUTION_URL%' -OutFile '%TMP_ZIP%'" || (
      echo Failed to download Maven. & exit /b 1
    )
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "Expand-Archive -Path '%TMP_ZIP%' -DestinationPath '%WRAPPER_DIR%' -Force" || (
      echo Failed to unzip Maven. & exit /b 1
    )
  del "%TMP_ZIP%" >NUL 2>NUL
)

if not exist "%MVN_CMD%" (
  echo Maven was not found after download: %MVN_CMD%
  exit /b 1
)

call "%MVN_CMD%" %*
exit /b %ERRORLEVEL%
