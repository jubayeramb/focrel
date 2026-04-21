use crate::error::{AppError, AppResult};
use once_cell::sync::OnceCell;
use parking_lot::Mutex;
use std::sync::mpsc::{self, Sender};

enum AudioCmd {
    Play { path: String, loop_forever: bool },
    Queue { path: String },
    Pause,
    Resume,
    Stop,
    SetVolume(f32),
    IsEmpty(std::sync::mpsc::Sender<bool>),
}

static AUDIO_TX: OnceCell<Mutex<Sender<AudioCmd>>> = OnceCell::new();

fn audio_sender() -> AppResult<parking_lot::MutexGuard<'static, Sender<AudioCmd>>> {
    let cell = AUDIO_TX.get_or_try_init(|| -> AppResult<Mutex<Sender<AudioCmd>>> {
        let (tx, rx) = mpsc::channel::<AudioCmd>();

        // rodio::OutputStream is !Send, so it must live on a dedicated OS thread.
        std::thread::Builder::new()
            .name("focrel-audio".into())
            .spawn(move || {
                use rodio::source::Source;
                use rodio::{Decoder, OutputStream, Sink};

                let (_stream, stream_handle) = match OutputStream::try_default() {
                    Ok(pair) => pair,
                    Err(e) => {
                        log::error!("audio: failed to open output stream: {e}");
                        return;
                    }
                };

                let mut sink: Option<Sink> = None;

                for cmd in rx {
                    match cmd {
                        AudioCmd::Play { path, loop_forever } => {
                            if let Some(s) = sink.take() {
                                s.stop();
                            }
                            match std::fs::File::open(&path) {
                                Ok(file) => {
                                    let buf = std::io::BufReader::new(file);
                                    match Decoder::new(buf) {
                                        Ok(source) => match Sink::try_new(&stream_handle) {
                                            Ok(s) => {
                                                if loop_forever {
                                                    s.append(source.repeat_infinite());
                                                } else {
                                                    s.append(source);
                                                }
                                                sink = Some(s);
                                            }
                                            Err(e) => {
                                                log::error!("audio: sink creation failed: {e}");
                                            }
                                        },
                                        Err(e) => {
                                            log::error!("audio: decode failed for {path}: {e}");
                                        }
                                    }
                                }
                                Err(e) => {
                                    log::error!("audio: open failed for {path}: {e}");
                                }
                            }
                        }
                        AudioCmd::Queue { path } => {
                            // Append to the existing sink so tracks play
                            // back-to-back without a gap. Create a sink if
                            // one doesn't exist yet.
                            if sink.is_none() {
                                if let Ok(s) = Sink::try_new(&stream_handle) {
                                    sink = Some(s);
                                } else {
                                    log::error!("audio: sink creation failed on queue");
                                    continue;
                                }
                            }
                            let s = sink.as_ref().unwrap();
                            match std::fs::File::open(&path) {
                                Ok(file) => match Decoder::new(std::io::BufReader::new(file)) {
                                    Ok(src) => s.append(src),
                                    Err(e) => log::error!("audio: decode failed for queued {path}: {e}"),
                                },
                                Err(e) => log::error!("audio: open failed for queued {path}: {e}"),
                            }
                        }
                        AudioCmd::Pause => {
                            if let Some(s) = &sink {
                                s.pause();
                            }
                        }
                        AudioCmd::Resume => {
                            if let Some(s) = &sink {
                                s.play();
                            }
                        }
                        AudioCmd::Stop => {
                            if let Some(s) = sink.take() {
                                s.stop();
                            }
                        }
                        AudioCmd::SetVolume(v) => {
                            if let Some(s) = &sink {
                                s.set_volume(v);
                            }
                        }
                        AudioCmd::IsEmpty(tx) => {
                            let empty = sink.as_ref().map(|s| s.empty()).unwrap_or(true);
                            let _ = tx.send(empty);
                        }
                    }
                }
            })
            .map_err(|e| AppError::AudioDevice(format!("failed to spawn audio thread: {e}")))?;

        Ok(Mutex::new(tx))
    })?;

    Ok(cell.lock())
}

fn send(cmd: AudioCmd) -> AppResult<()> {
    audio_sender()?
        .send(cmd)
        .map_err(|_| AppError::AudioDevice("audio thread disconnected".into()))
}

#[tauri::command]
pub fn audio_play(path: String, loop_forever: Option<bool>) -> AppResult<()> {
    send(AudioCmd::Play {
        path,
        loop_forever: loop_forever.unwrap_or(false),
    })
}

#[tauri::command]
pub fn audio_queue(path: String) -> AppResult<()> {
    send(AudioCmd::Queue { path })
}

#[tauri::command]
pub fn audio_is_empty() -> AppResult<bool> {
    let (tx, rx) = std::sync::mpsc::channel();
    send(AudioCmd::IsEmpty(tx))?;
    rx.recv_timeout(std::time::Duration::from_millis(500))
        .map_err(|_| AppError::AudioDevice("audio thread did not respond to IsEmpty".into()))
}

#[tauri::command]
pub fn audio_pause() -> AppResult<()> {
    send(AudioCmd::Pause)
}

#[tauri::command]
pub fn audio_resume() -> AppResult<()> {
    send(AudioCmd::Resume)
}

#[tauri::command]
pub fn audio_stop() -> AppResult<()> {
    send(AudioCmd::Stop)
}

#[tauri::command]
pub fn audio_set_volume(volume: f32) -> AppResult<()> {
    let clamped = volume.clamp(0.0, 1.0);
    send(AudioCmd::SetVolume(clamped))
}

#[tauri::command]
pub fn audio_seek(_seconds: f64) -> AppResult<()> {
    // TODO: rodio does not expose seek on all decoder sources in 0.19.
    // Implement when rodio stabilises Seek trait support across all formats.
    Err(AppError::Other("seek not supported".into()))
}
