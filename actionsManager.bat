@echo off
REM ============================================================
REM  actions-manager — single entry point for all actions
REM
REM  Usage:
REM    actionsManager.bat                  → interactive dropdown (manual)
REM    actionsManager.bat dailyEventsBot   → run specific action (Task Scheduler)
REM ============================================================

cd /d "C:\Or\web\projects\actions-manager"
set NODE_NO_WARNINGS=1
pnpm start %*
