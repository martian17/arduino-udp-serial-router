const int pin6 = 6;

void setup() {
  pinMode(pin6, OUTPUT);
  digitalWrite(pin6, LOW);
  Serial.begin(115200);
}

void loop() {
  if (Serial.available() > 0) {
    char incoming = Serial.read();
    if (incoming == '1') {
      digitalWrite(pin6, HIGH);
    } else if (incoming == '0') {
      digitalWrite(pin6, LOW);
    }
  }
}
