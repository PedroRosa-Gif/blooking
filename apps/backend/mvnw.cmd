@REM ----------------------------------------------------------------------------
@REM Apache Maven Wrapper startup script (Windows).
@REM If a Maven install is on PATH it is used directly; otherwise install Maven
@REM (or use the native Ollama/Maven on the host) — the simple fallback below
@REM delegates to any "mvn" found on PATH.
@REM ----------------------------------------------------------------------------
@echo off
where mvn >NUL 2>NUL
if %ERRORLEVEL%==0 (
  mvn %*
  goto :eof
)
echo Maven not found on PATH. Please install Maven 3.9+ or add it to PATH.
echo See .mvn\wrapper\maven-wrapper.properties for the expected version.
exit /b 1
