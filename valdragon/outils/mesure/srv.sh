#!/bin/sh
curl -s -o /dev/null localhost:8765/shell.html || (cd /home/claude/t3d && setsid nohup python3 -m http.server 8765 >/tmp/srv.log 2>&1 & sleep 1)
