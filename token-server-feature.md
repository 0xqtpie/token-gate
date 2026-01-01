# Task: Background Service Management for tokengate-server

## Overview

Implement CLI commands that allow users to install tokengate-server as a background service that auto-starts on boot, without requiring root/admin privileges.

## Commands to Implement

| Command                      | Description                                |
| ---------------------------- | ------------------------------------------ |
| `tokengate-server install`   | Install and start as background service    |
| `tokengate-server uninstall` | Stop and remove service                    |
| `tokengate-server start`     | Start the service                          |
| `tokengate-server stop`      | Stop the service                           |
| `tokengate-server status`    | Check if running, show PID                 |
| `tokengate-server run`       | Run in foreground (default, for debugging) |

---

## Platform: macOS (LaunchAgent)

### Install

1. Generate plist file at `~/Library/LaunchAgents/com.tokengate.server.plist`
2. Plist contents:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tokengate.server</string>
    <key>ProgramArguments</key>
    <array>
        <string>/path/to/bun</string>
        <string>/path/to/tokengate-server/dist/index.js</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>~/.tokengate/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>~/.tokengate/logs/stderr.log</string>
</dict>
</plist>
```

3. Run `launchctl load ~/Library/LaunchAgents/com.tokengate.server.plist`
4. Run `launchctl start com.tokengate.server`

### Uninstall

1. Run `launchctl stop com.tokengate.server`
2. Run `launchctl unload ~/Library/LaunchAgents/com.tokengate.server.plist`
3. Delete plist file

### Start

1. Run `launchctl start com.tokengate.server`

### Stop

1. Run `launchctl stop com.tokengate.server`

### Status

1. Run `launchctl list | grep com.tokengate.server`
2. Parse output for PID and status
3. Also check if port 3847 is responding

---

## Platform: Linux (systemd user service)

### Install

1. Create directory `~/.config/systemd/user/` if not exists
2. Generate service file at `~/.config/systemd/user/tokengate-server.service`
3. Service contents:

```ini
[Unit]
Description=TokenGate Server
After=network.target

[Service]
Type=simple
ExecStart=/path/to/bun /path/to/tokengate-server/dist/index.js run
Restart=always
RestartSec=5
StandardOutput=append:%h/.tokengate/logs/stdout.log
StandardError=append:%h/.tokengate/logs/stderr.log

[Install]
WantedBy=default.target
```

4. Run `systemctl --user daemon-reload`
5. Run `systemctl --user enable tokengate-server`
6. Run `systemctl --user start tokengate-server`

### Uninstall

1. Run `systemctl --user stop tokengate-server`
2. Run `systemctl --user disable tokengate-server`
3. Delete service file
4. Run `systemctl --user daemon-reload`

### Start

1. Run `systemctl --user start tokengate-server`

### Stop

1. Run `systemctl --user stop tokengate-server`

### Status

1. Run `systemctl --user status tokengate-server`
2. Parse output for status and PID

---

## Platform: Windows (Scheduled Task)

### Install

1. Create VBS wrapper script at `%APPDATA%\tokengate\start.vbs` (to run hidden):

```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c bun /path/to/tokengate-server run", 0, False
```

2. Create scheduled task using PowerShell:

```powershell
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "$env:APPDATA\tokengate\start.vbs"
$trigger = New-ScheduledTaskTrigger -AtLogon
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "TokenGateServer" -Action $action -Trigger $trigger -Principal $principal -Settings $settings
```

3. Start the task immediately

### Uninstall

1. Stop the process (find by port or name)
2. Run `Unregister-ScheduledTask -TaskName "TokenGateServer" -Confirm:$false`
3. Delete wrapper script

### Start

1. Run `Start-ScheduledTask -TaskName "TokenGateServer"`

### Stop

1. Find process listening on port 3847
2. Kill the process

### Status

1. Check if scheduled task exists: `Get-ScheduledTask -TaskName "TokenGateServer"`
2. Check if port 3847 is responding

---

## Implementation Details

### File Structure

```
src/
├── cli/
│   ├── index.ts          # CLI entry point, command parser
│   ├── commands/
│   │   ├── install.ts
│   │   ├── uninstall.ts
│   │   ├── start.ts
│   │   ├── stop.ts
│   │   ├── status.ts
│   │   └── run.ts
│   └── services/
│       ├── types.ts      # ServiceManager interface
│       ├── macos.ts      # LaunchAgent implementation
│       ├── linux.ts      # systemd implementation
│       ├── windows.ts    # Scheduled Task implementation
│       └── index.ts      # Platform detection + factory
```

### ServiceManager Interface

```typescript
interface ServiceManager {
  install(): Promise<void>;
  uninstall(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): Promise<ServiceStatus>;
}

interface ServiceStatus {
  installed: boolean;
  running: boolean;
  pid?: number;
  port?: number;
  uptime?: number;
}
```

### Platform Detection

```typescript
function getServiceManager(): ServiceManager {
  switch (process.platform) {
    case "darwin":
      return new MacOSServiceManager();
    case "linux":
      return new LinuxServiceManager();
    case "win32":
      return new WindowsServiceManager();
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}
```

### Path Resolution

- Need to resolve absolute paths for bun and the server script
- Use `which bun` or `where bun` to find bun executable
- Use `import.meta.dir` or similar to find script location
- Handle both global install and bunx scenarios

### Logging

- Create `~/.tokengate/logs/` directory on install
- Rotate logs if they get too large (or document manual cleanup)
- `status` command should show log file locations

---

## CLI Output Examples

### Install (success)

```
$ tokengate-server install
✓ Created service configuration
✓ Started tokengate-server
✓ Server running on http://localhost:3847

TokenGate will now start automatically when you log in.
```

### Install (already installed)

```
$ tokengate-server install
TokenGate server is already installed.
Use 'tokengate-server status' to check if it's running.
```

### Status (running)

```
$ tokengate-server status
TokenGate Server
  Status:  ● Running
  PID:     12345
  URL:     http://localhost:3847
  Uptime:  2h 34m
  Logs:    ~/.tokengate/logs/
```

### Status (stopped)

```
$ tokengate-server status
TokenGate Server
  Status:  ○ Stopped (installed)

Run 'tokengate-server start' to start the server.
```

### Status (not installed)

```
$ tokengate-server status
TokenGate Server
  Status:  ○ Not installed

Run 'tokengate-server install' to install as a background service.
Or run 'tokengate-server run' to start in foreground.
```

### Uninstall

```
$ tokengate-server uninstall
✓ Stopped server
✓ Removed service configuration

TokenGate server has been uninstalled.
```

---

## Edge Cases to Handle

1. **bunx vs global install**: Paths differ, need to detect and handle both
2. **Bun not in PATH for launchd**: LaunchAgents don't inherit shell PATH, need absolute paths
3. **Port already in use**: Detect and show helpful error
4. **Stale PID files**: Service thinks it's running but process is dead
5. **Permissions errors**: Can't write to LaunchAgents folder, etc.
6. **WSL on Windows**: Detect and use Linux path, not Windows

---

## Testing Checklist

- [x] macOS: install, start, stop, status, uninstall
- [ ] macOS: survives logout/login
- [ ] macOS: survives reboot
- [ ] Linux: install, start, stop, status, uninstall
- [ ] Linux: survives logout/login (lingering enabled)
- [ ] Linux: survives reboot
- [ ] Windows: install, start, stop, status, uninstall
- [ ] Windows: survives logout/login
- [ ] Windows: survives reboot
- [ ] All: bunx usage works
- [ ] All: global install works
- [ ] All: helpful errors on failure
