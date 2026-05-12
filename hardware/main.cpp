#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h> 

// konfigurasi wifi & server
const char* ssid = "tsaqif";         
const char* password = "tsaqif"; 
const char* serverName = "http://10.35.96.202/api/api.php";

// pin esp32
const int mq2Pin = 34;      
const int buzzerPin = 18;   
const int ledPin = 4;       
const int relayPin = 26;    

// variabel
int sensorValue = 0;
unsigned long waktuTerakhirKirim = 0;
const unsigned long jedaKirim = 3000; 

void setup() {
  Serial.begin(115200);
  
  // set output pin
  pinMode(buzzerPin, OUTPUT); 
  pinMode(ledPin, OUTPUT); 
  pinMode(relayPin, OUTPUT); 

  // indikator menyala
  for(int i = 0; i < 5; i++) {
    digitalWrite(ledPin, HIGH);
    delay(100);
    digitalWrite(ledPin, LOW);
    delay(100);
  }
  delay(1000); 

  // kondisi awal
  digitalWrite(buzzerPin, LOW); 
  digitalWrite(relayPin, HIGH); 
  
  // koneksi wifi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Terhubung!");
}

void loop() {
  // auto-reconnect wifi
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.disconnect();
    WiFi.reconnect();
    delay(3000); 
    return; 
  }

  // baca sensor
  sensorValue = analogRead(mq2Pin);

  // kirim data ke server (POST)
  if (millis() - waktuTerakhirKirim >= jedaKirim) {
    WiFiClient client;
    HTTPClient http;
    
    http.begin(client, serverName);
    http.addHeader("Content-Type", "application/x-www-form-urlencoded");
    
    String httpRequestData = "nilai_asap=" + String(sensorValue);
    int httpResponseCode = http.POST(httpRequestData);
    
    if (httpResponseCode > 0) {
      Serial.println("Data Terkirim: " + String(sensorValue));
    } else {
      Serial.println("Error HTTP: " + String(httpResponseCode));
    }
    
    http.end();
    waktuTerakhirKirim = millis();
  }

  // logika mitigasi asap
  if (sensorValue < 500) { 
    // normal
    digitalWrite(buzzerPin, LOW);  
    digitalWrite(ledPin, LOW);     
    digitalWrite(relayPin, HIGH); 
    delay(100); 
  } 
  else if (sensorValue >= 500 && sensorValue <= 1000) {
    // waspada
    digitalWrite(relayPin, LOW); 
    digitalWrite(buzzerPin, HIGH); 
    digitalWrite(ledPin, HIGH); 
    delay(100);                    
    digitalWrite(buzzerPin, LOW);  
    digitalWrite(ledPin, LOW); 
    delay(1000);                   
  } 
  else {
    // kritis
    digitalWrite(relayPin, LOW); 
    digitalWrite(buzzerPin, HIGH); 
    digitalWrite(ledPin, HIGH); 
    delay(100);                    
    digitalWrite(buzzerPin, LOW);  
    digitalWrite(ledPin, LOW); 
    delay(100);                    
  }
}