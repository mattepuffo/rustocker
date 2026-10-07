use tokio::process::Command;

pub async fn run_docker(args: &[&str]) -> Result<std::process::Output, String> {
    if cfg!(target_os = "windows") {
        // Opzionale: puoi specificare la distro se non è quella di default
        // .args(["-d", "Ubuntu", "docker"].into_iter().chain(args.iter().copied()))

        Command::new("wsl")
            .arg("docker")
            .args(args)
            .output()
            .await
            .map_err(|e| format!("wsl docker failed: {}", e))
    } else {
        Command::new("docker")
            .args(args)
            .output()
            .await
            .map_err(|e| e.to_string())
    }
}

#[cfg(target_os = "windows")]
pub fn spawn_external_terminal(cmd: &str) -> std::io::Result<()> {
    const CREATE_NEW_CONSOLE: u32 = 0x00000010;

    Command::new("powershell")
      .args(["-NoExit", "-Command", cmd])
      .creation_flags(CREATE_NEW_CONSOLE)
      .spawn()?;

    Ok(())
}

#[cfg(target_os = "macos")]
pub fn spawn_external_terminal(cmd: &str) -> std::io::Result<()> {
    let script = format!(
        "tell application \"Terminal\"\n activate\n do script \"{}\"\n end tell",
        cmd.replace('\\', "\\\\").replace('"', "\\\"")
    );

    Command::new("osascript").args(["-e", &script]).spawn()?;

    Ok(())
}

#[cfg(target_os = "linux")]
pub fn spawn_external_terminal(cmd: &str) -> std::io::Result<()> {
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