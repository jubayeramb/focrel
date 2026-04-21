use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Audio decode error: {0}")]
    AudioDecode(String),

    #[error("Audio device error: {0}")]
    AudioDevice(String),

    #[error("Wallpaper error: {0}")]
    Wallpaper(String),

    #[error("Shortcut failed: {0}")]
    ShortcutFailed(String),

    #[error("App quit failed: {0}")]
    AppQuitFailed(String),

    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Tauri API error: {0}")]
    TauriApi(String),

    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
