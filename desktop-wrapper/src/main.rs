// Thin wrapper: opens a native window pointed at the self-hosted Kan instance.
// ponytail: URL is hardcoded per-user at build time; make it a config prompt if teammates host elsewhere.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    let url = option_env!("KAN_URL").unwrap_or("http://MacBook-Pro-de-Angelo.local:3456");
    tauri::Builder::default()
        .setup(move |app| {
            let window = tauri::WebviewWindowBuilder::new(
                app,
                "kan",
                tauri::WebviewUrl::External(url.parse().expect("valid KAN_URL")),
            )
            .title("OTSICAL")
            .inner_size(1280.0, 800.0)
            .build()?;
            let _ = window;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
