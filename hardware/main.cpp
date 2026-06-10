#include <Arduino.h>
#include <WiFi.h>
#include <WiFiManager.h> 
#include <PubSubClient.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// server
const char* mqtt_server = "broker.emqx.io"; 
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

// PIN ESP32 (Sesuai aslinya)
const int mq2Pin = 34;      
const int buzzerPin = 33;          
const int relayPin = 21;    

// VARIABEL SENSOR (Sesuai aslinya)
int sensorValue = 0;
unsigned long waktuTerakhirKirim = 0;
const unsigned long jedaKirim = 1000; 

// --- VARIABEL BARU UNTUK MODE MANUAL ---
bool modeManual = false; 
int kecepatanManual = 0; 

// subscribe
void callback(char* topic, byte* payload, unsigned int length) {
  String pesan = "";
  for (int i = 0; i < length; i++) {
    pesan += (char)payload[i];
  }
  
  Serial.print("Perintah Masuk dari Dashboard: ");
  Serial.println(pesan);

  // Logika Override yang Sudah Disempurnakan
  if (pesan == "AUTO") {
    modeManual = false;
    Serial.println("Sistem kembali ke Mode Otomatis!");
  } 
  else if (pesan == "MANUAL_OFF") {
    modeManual = true;
    kecepatanManual = 0;
    Serial.println("Mode Manual: Kipas DIMATIKAN.");
  } 
  else if (pesan == "MANUAL_LOW") {
    modeManual = true;
    kecepatanManual = 130; // Sesuai dengan logika WASPADA (Gigi 1)
    Serial.println("Mode Manual: Kipas PELAN (LOW).");
  }
  else if (pesan == "MANUAL_HIGH") {
    modeManual = true;
    kecepatanManual = 255; // Sesuai dengan logika KRITIS (Gigi 2)
    Serial.println("Mode Manual: Kipas KENCANG (HIGH).");
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Mencoba koneksi ke Broker EMQX...");
    String clientId = "ESP32-Smoke-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println(" Berhasil Terhubung!");
      
      // Wajib: Berlangganan ke topik perintah setelah connect!
      client.subscribe("tsaqif_ub_vm17/kendali_kipas");
      
    } else {
      Serial.print(" Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0); 
  
  Serial.begin(115200);
  delay(1000); 

  pinMode(buzzerPin, OUTPUT); 
  pinMode(relayPin, OUTPUT); 
  digitalWrite(buzzerPin, LOW); 
  analogWrite(relayPin, 0); 

  WiFiManager wifiManager;
  if (!wifiManager.autoConnect("ESP-Smoke-Setup")) {
    delay(3000);
    ESP.restart(); 
  }

  client.setServer(mqtt_server, mqtt_port);
  
  // Daftarkan fungsi penangkap pesan ke sistem MQTT
  client.setCallback(callback); 
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 


  sensorValue = analogRead(mq2Pin);
  int nilaiPPM = map(sensorValue, 0, 4095, 0, 1000); 
  if (nilaiPPM < 0) nilaiPPM = 0; 

  if (millis() - waktuTerakhirKirim >= jedaKirim) {
    String payload = String(nilaiPPM);
    client.publish("tsaqif_ub_vm17/sensor_asap", payload.c_str());
    waktuTerakhirKirim = millis(); 
  }
  // override
  if (modeManual == true) {
    // Jika manual diaktifkan, jalankan perintah dari internet, abaikan sensor!
    analogWrite(relayPin, kecepatanManual);
    digitalWrite(buzzerPin, LOW); // Matikan buzzer biar gak berisik saat di-test
  } 
  else {
    if (nilaiPPM < 300) { 
      digitalWrite(buzzerPin, LOW);     
      analogWrite(relayPin, 0); 
      delay(100); 
    } 
    else if (nilaiPPM >= 300 && nilaiPPM <= 600) {
      analogWrite(relayPin, 130);    
      digitalWrite(buzzerPin, HIGH); 
      delay(100);                    
      digitalWrite(buzzerPin, LOW);  
      delay(100);                   
    } 
    else {
      analogWrite(relayPin, 255);    
      digitalWrite(buzzerPin, HIGH); 
      delay(100);                    
      digitalWrite(buzzerPin, LOW);  
      delay(100);                    
    }
  }
}