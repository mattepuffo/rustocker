use tokio::process::Command;

#[tauri::command]
pub async fn docker_psa() -> Result<String, String> {
    let output = Command::new("docker")
        .args(["ps", "-a", "--format", "{{json .}}"])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn docker_inspect(id: String) -> Result<String, String> {
    let output = Command::new("docker")
        .args(["inspect", id.as_str()])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn start_container(id: String) -> Result<String, String> {
    let output = Command::new("docker")
        .args(["start", id.as_str()])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn stop_container(id: String) -> Result<String, String> {
    let output = Command::new("docker")
        .args(["stop", id.as_str()])
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn exec_shell(id: String) -> Result<(), String> {
    if id.is_empty()
        || !id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || "-_.".contains(c))
    {
        return Err("Container id non valido".into());
    }

    let docker_cmd = format!(
        "docker exec -it {id} sh -c \"command -v bash >/dev/null && exec bash || exec sh\""
    );

    spawn_external_terminal(&docker_cmd)
        .map_err(|e| format!("Impossibile aprire il terminale: {e}"))
}

#[cfg(target_os = "windows")]
fn spawn_external_terminal(cmd: &str) -> std::io::Result<()> {
    const CREATE_NEW_CONSOLE: u32 = 0x00000010;

    Command::new("powershell")
        .args(["-NoExit", "-Command", cmd])
        .creation_flags(CREATE_NEW_CONSOLE)
        .spawn()?;

    Ok(())
}

#[cfg(target_os = "macos")]
fn spawn_external_terminal(cmd: &str) -> std::io::Result<()> {
    let script = format!(
        "tell application \"Terminal\"\n activate\n do script \"{}\"\n end tell",
        cmd.replace('\\', "\\\\").replace('"', "\\\"")
    );

    Command::new("osascript").args(["-e", &script]).spawn()?;

    Ok(())
}

#[cfg(target_os = "linux")]
fn spawn_external_terminal(cmd: &str) -> std::io::Result<()> {
    let terminals: &[(&str, &[&str])] = &[
        ("x-terminal-emulator", &["-e"]),
        ("gnome-terminal", &["--"]),
        ("konsole", &["-e"]),
        ("xfce4-terminal", &["-e"]),
        ("alacritty", &["-e"]),
        ("kitty", &[]),
        ("xterm", &["-e"]),
    ];

    let full = format!("{cmd}; exec $SHELL");

    for (term, flags) in terminals {
        if Command::new(term)
            .args(*flags)
            .args(["bash", "-c", &full])
            .spawn()
            .is_ok()
        {
            return Ok(());
        }
    }

    Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "Nessun terminale trovato",
    ))
}
