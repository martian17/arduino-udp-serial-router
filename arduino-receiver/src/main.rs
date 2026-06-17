use tokio::net::UdpSocket;
use device_query::{DeviceQuery, DeviceState, Keycode};
use std::time::Duration;
use tokio::time::sleep;

#[tokio::main]
async fn main() {
    // Arduino serial setup
    let port_name = "/dev/ttyACM0"; 
    let baud_rate = 115200;

    let mut port = serialport::new(port_name, baud_rate)
        .timeout(Duration::from_millis(10))
        .open()
        .expect("Failed to open serial port");

    let device_state = DeviceState::new();

    println!("Listening for 'K' key. Arduino on {}.", port_name);


    // UDP setup
    let sock = UdpSocket::bind("0.0.0.0:54736").await.unwrap();
    let mut buf = [0; 1024];
    loop {
        let (len, addr) = sock.recv_from(&mut buf).await.unwrap();
        println!("{:?} bytes received from {:?}", len, addr);
        match std::str::from_utf8(&buf[0..len]) {
            Ok(v) => {
                println!("{}", v);
            }
            Err(e) => {
                println!("{:?}", e);
            }
        }
        // banging it regardless
        port.write_all(b"1").unwrap();
        sleep(Duration::from_millis(50)).await;
        port.write_all(b"0").unwrap();

    }
}
