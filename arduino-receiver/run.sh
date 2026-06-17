# arduino-cli compile --fqbn arduino:avr:uno . & arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno .

arduino-cli compile --fqbn arduino:avr:uno . && \
arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:avr:uno . && \
cargo run


#&& \
# arduino-cli monitor -p /dev/ttyACM0 -c baudrate=9600

