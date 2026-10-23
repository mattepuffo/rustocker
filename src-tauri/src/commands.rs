use crate::docker_helper::{run_docker, spawn_external_terminal};

#[tauri::command]
pub async fn docker_psa() -> Result<String, String> {
    let output = run_docker(&["ps", "-a", "--format", "{{json .}}"]).await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn docker_inspect(id: String) -> Result<String, String> {
    let output = run_docker(&["inspect", id.as_str()]).await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn start_container(id: String) -> Result<String, String> {
    let output = run_docker(&["start", id.as_str()]).await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    Ok(String::from_utf8_lossy(&output.stdout).into_owned())
}

#[tauri::command]
pub async fn stop_container(id: String) -> Result<String, String> {
    let output = run_docker(&["stop", id.as_str()]).await?;

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

    let mut docker_cmd = format!(
        "docker exec -it {id} sh -c \"command -v bash >/dev/null && exec bash || exec sh\""
    );

    if cfg!(target_os = "windows") {
        docker_cmd = format!(
            "wsl docker exec -it {id} sh -c \"command -v bash >/dev/null && exec bash || exec sh\""
        );
    }

    spawn_external_terminal(&docker_cmd)
        .map_err(|e| format!("Impossibile aprire il terminale: {e}"))
}

#[tauri::command]
pub async fn docker_system_df() -> Result<String, String> {
    let output = run_docker(&["system", "df", "--format", "{{json .}}"]).await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    let items: Vec<serde_json::Value> = stdout
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            serde_json::from_str(line)
                .map_err(|e| format!("Failed to parse line '{}': {}", line, e))
        })
        .collect::<Result<_, _>>()?;

    serde_json::to_string(&items).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cleanup_docker() -> Result<String, String> {
    let commands: &[&[&str]] = &[
        &["image", "prune", "-a", "-f"],
        &["volume", "prune", "-f"],
        &["builder", "prune", "-f"],
        &["network", "prune", "-f"],
    ];

    let mut full_output = String::new();

    for args in commands {
        let output = run_docker(args).await?;

        full_output.push_str(&format!("=== docker {} ===\n", args.join(" ")));

        if !output.stdout.is_empty() {
            full_output.push_str(&String::from_utf8_lossy(&output.stdout));
            if !full_output.ends_with('\n') {
                full_output.push('\n');
            }
        }

        if !output.stderr.is_empty() {
            full_output.push_str(&String::from_utf8_lossy(&output.stderr));
            if !full_output.ends_with('\n') {
                full_output.push('\n');
            }
        }

        if !output.status.success() {
            return Err(format!(
                "Comando fallito: docker {}\n\nOutput finora:\n{}",
                args.join(" "),
                full_output
            ));
        }

        full_output.push('\n');
    }

    Ok(full_output)
}

#[tauri::command]
pub async fn docker_stats() -> Result<String, String> {
    let output = run_docker(&["stats", "-a", "--no-stream", "--no-trunc", "--format", "{{json .}}"]).await?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Docker command failed: {}", stderr));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    let items: Vec<serde_json::Value> = stdout
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| {
            serde_json::from_str(line)
                .map_err(|e| format!("Failed to parse line '{}': {}", line, e))
        })
        .collect::<Result<_, _>>()?;

    serde_json::to_string(&items).map_err(|e| e.to_string())
}
