use crate::docker_helper::{run_docker, spawn_external_terminal};
use tokio::process::Command;

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
