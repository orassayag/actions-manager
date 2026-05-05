@echo off
REM ============================================================
REM  actions-manager — single entry point for all actions
REM
REM  Usage:
REM    run.bat                  → interactive dropdown (manual)
REM    run.bat dailyEventsBot   → run specific action (Task Scheduler)
REM ============================================================

cd /d "%~dp0"
set NODE_NO_WARNINGS=1
pnpm start %*
