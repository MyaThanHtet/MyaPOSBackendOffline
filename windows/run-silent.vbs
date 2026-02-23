Option Explicit

Dim shell, fso, scriptDir, batPath, cmd
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
batPath = fso.BuildPath(scriptDir, "start-pos.bat")

cmd = "cmd.exe /c """ & batPath & """"
shell.Run cmd, 0, False
