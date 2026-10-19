//! QR path data for each app's downloads page, one per language.
//! usage: qrgen <url>...  → one line per url: "<size> <svg path d>"
use qrcode::{EcLevel, QrCode, types::Color};
fn main() {
    for url in std::env::args().skip(1) {
        let code = QrCode::with_error_correction_level(url.as_bytes(), EcLevel::M).unwrap();
        let w = code.width();
        let colors = code.to_colors();
        let mut d = String::new();
        for y in 0..w {
            let mut x = 0;
            while x < w {
                if colors[y * w + x] == Color::Dark {
                    let start = x;
                    while x < w && colors[y * w + x] == Color::Dark {
                        x += 1;
                    }
                    let n = x - start;
                    d.push_str(&format!("M{start} {y}h{n}v1h-{n}z"));
                } else {
                    x += 1;
                }
            }
        }
        println!("{w} {d}");
    }
}
