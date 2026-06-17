import dgram from 'node:dgram';
import readline from 'node:readline';
import fs from 'node:fs';

const PORT = 54736;
// const TARGET_IP = '192.168.1.200'; // Change to your target IP
const TARGET_IP = '0.0.0.0'; // Change to your target IP

// Construct a raw OSC message: Address + padding + typetag (,) + padding
// "/solenoid/on" (12 bytes) + 4 nulls = 16 bytes
// "," (1 byte) + 3 nulls = 4 bytes. Total = 20 bytes.
const oscMessage = Buffer.from('/solenoid/on\0\0\0\0,\0\0\0', 'ascii');

// Create UDP socket
const socket = dgram.createSocket('udp4');

// Emulate oscEvent()
socket.on('message', (msg, rinfo) => {
  if (msg.toString('ascii').startsWith('/solenoid/on')) {
    console.log("msg = /solenoid/on");
    
    // Node.js stdlib doesn't have native serial access.
    // Write to console, or write directly to a Unix character device if known:
    console.log(">> SERIAL TX: on");
    
    // Example for Linux/macOS raw serial write (uncomment and change path):
    // try { fs.appendFileSync('/dev/ttyACM0', 'on\n'); } catch(e) {}
  }
});

socket.bind(PORT, () => {
  console.log(`Listening for OSC on UDP port ${PORT}`);
});

// Emulate mousePressed() using the Return/Enter key
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("Press [ENTER] to send OSC message...");
rl.on('line', () => {
  socket.send(oscMessage, 0, oscMessage.length, PORT, TARGET_IP, (err) => {
    if (err) console.error("Error sending:", err);
    else console.log(`Sent /solenoid/on to ${TARGET_IP}:${PORT}`);
  });
});
