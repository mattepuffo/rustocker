mod commands;
mod docker_helper;
mod window_state;

use crate::commands::{
    docker_inspect, docker_psa, docker_system_df, exec_shell, start_container, stop_container,
};
use crate::window_state::WindowState;
use serde_json::json;
use tauri::{Manager, PhysicalSize, WindowEvent};
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            docker_psa,
            docker_inspect,
            start_container,
            stop_container,
            exec_shell,
            docker_system_df
        ])
        .setup(|app| {
            let store = app.store("msymon_settings.json")?;
            let store_settings: WindowState = store
                .get("settings")
                .and_then(|value| serde_json::from_value(value).ok())
                .unwrap_or(WindowState {
                    is_maximized: false,
                });

            if let Some(window) = app.get_webview_window("main") {
                if store_settings.is_maximized {
                    let _ = window.maximize();
                } else {
                    if let Ok(Some(monitor)) = window.current_monitor() {
                        let size = monitor.size();
                        let scale_factor = monitor.scale_factor();

                        let width = (size.width as f64 * 0.8 / scale_factor) as u32;
                        let height = (size.height as f64 * 0.8 / scale_factor) as u32;

                        let _ =
                            window.set_size(tauri::Size::Physical(PhysicalSize { width, height }));

                        let _ = window.center();
                    }
                }
            }

            let main_window = app
                .get_webview_window("main")
                .expect("main window not found");

            // SALVATAGGIO STATO ALLA CHIUSURA
            main_window.on_window_event({
                let window = main_window.clone();

                move |event| {
                    if let WindowEvent::CloseRequested { .. } = event {
                        if let Ok(is_maximized) = window.is_maximized() {
                            store.set("settings", json!(WindowState { is_maximized }));
                        }
                    }
                }
            });

            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

                let platform = tauri_plugin_os::platform();
                if platform == "macos" {
                    let quit_shortcut = Shortcut::new(Some(Modifiers::META), Code::KeyQ);

                    app.handle().plugin(
                        tauri_plugin_global_shortcut::Builder::new()
                            .with_handler(move |app, shortcut, event| {
                                if shortcut == &quit_shortcut {
                                    match event.state() {
                                        ShortcutState::Pressed => {
                                            app.exit(0);
                                        }
                                        ShortcutState::Released => {
                                            println!("Ctrl-N Released!");
                                        }
                                    }
                                }
                            })
                            .build(),
                    )?;

                    app.global_shortcut().register(quit_shortcut)?;
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
