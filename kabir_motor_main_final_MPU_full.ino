#include <Wire.h>
#include <WiFi.h>
#include <WiFiManager.h>
#include <WebServer.h>
#include <Preferences.h>
#define MQTT_MAX_PACKET_SIZE 1024

#include <PubSubClient.h>
#include <mpu6050.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <ArduinoOTA.h>
#include <Update.h>

//======= SHT20 =========
#include "DFRobot_SHT20.h"

DFRobot_SHT20 sht20(&Wire);

float temp_offset = 0.0f;
float hum_offset  = 0.0f;
float temperature;
float humidity;
//=======================
#include <SPI.h>
#include <SD.h>

//======== SD Card
#define SD_CS 5

bool sdReady = false;
//===================
bool otaBusy = false;

void setupOTA();
void handleOTAUploadPage();
void handleOTAUpdate();


// ---- WiFi + MQTT ----
WiFiClient espClient;
PubSubClient* mqtt;   // ✅ pointer-based
// ---------- AP settings ------------------
Preferences prefs;
WebServer server(80);

String deviceName;
String mqttServer;
int mqttPort;
bool apMode = false;


//--------- AP Portal ----------
// ----------- SIMPLE HTML TEMPLATES -----------
String htmlHeader(String title) {
    return String(
        "<html><head>"
        "<meta name='viewport' content='width=device-width, initial-scale=1'>"
        "<style>"
        "body{font-family:Arial;background:#f2f2f2;margin:20px;color:#333;}"
        ".box{background:white;padding:20px;border-radius:10px;"
        "box-shadow:0 0 5px #bbb;margin-top:15px;}"
        "input{width:100%;padding:10px;margin-top:8px;border-radius:6px;"
        "border:1px solid #aaa;}"
        "button{background:#007aff;color:white;padding:10px 16px;border:none;"
        "border-radius:6px;margin-top:12px;font-size:16px;}"
        "</style></head><body><h2>" + title + "</h2><div class='box'>"
    );
}

String htmlFooter() {
    return "</div></body></html>";
}


const char* MQTT_BROKER_IP = "";
const int   MQTT_PORT_TCP  = 1883;
const char* MQTT_USER_     = "myuser";
const char* MQTT_PASS_     = "123admin123";
const char* MQTT_CLIENT    = "esp32-gps-01";

const char* TOPIC_STATE = "home/esp32-gps/state";
const char* TOPIC_RELAY_CMD = "relay/gr01/control";


bool buttonPrev = HIGH;
unsigned long buttonPressedAt = 0;
bool longPressHandled = false;

const unsigned long LONG_PRESS_MS = 3000;

// ---- MPU6050 ----
#define MPU_ADDRESS 0x68

float rawGX, rawGY, rawGZ;
float rawAX, rawAY, rawAZ;

float gX, gY, gZ;
float dpsX, dpsY, dpsZ;
float pitchG, rollG, yawG;
float pitchA, rollA;
// ---- Persistent MPU Baseline in Preferences ----
#define PREF_BASE_PITCH "b_pitch"
#define PREF_BASE_ROLL  "b_roll"
#define PREF_BASE_AX    "b_ax"
#define PREF_BASE_AY    "b_ay"
#define PREF_BASE_AZ    "b_az"
#define PREF_BASE_VALID "b_valid"

bool mpuBaselineStored = false;
float lastAccelMag = 1.0f;

float fPitch = 0, fRoll = 0, fYaw = 0;

double gyroOffsetX = 0, gyroOffsetY = 0, gyroOffsetZ = 0;
double accelOffsetX = 0, accelOffsetY = 0;

// float MOTION_THR = 2.0;
// float CRASH_THR  = 4.0;
// float TILT_THR   = 25;

String mpuEvent = "none";

unsigned long lastMpuCompute = 0;
unsigned long lastPublish    = 0;
const unsigned long MPU_INTERVAL = 100;
// ---------- MQTT Topics ----------
const char* TOPIC_MPU_CMD        = "home/esp32-gps/mpu/cmd";
const char* TOPIC_MPU_ALARM      = "home/esp32-gps/mpu/alarm";
const char* TOPIC_MPU_CRASH      = "home/esp32-gps/mpu/crash";
const char* TOPIC_MPU_STATUS     = "home/esp32-gps/mpu/state";
const char* TOPIC_MPU_theft      = "home/esp32-gps/mpu/theft";

// ---------- MPU Modes ----------
bool alarmArmed = false;          // دزدگیر فعال/غیرفعال
bool theftAlarmSent = false;      // جلوگیری از ارسال تکراری
bool crashAlarmSent = false;
unsigned long ignoreMpuUntil = 0;


float basePitch = 0.0;
float baseRoll  = 0.0;
float baseAX = 0.0;
float baseAY = 0.0;
float baseAZ = 0.0;

// thresholds
float ALARM_TILT_DELTA_THR   = 70.0;    // تغییر زاویه نسبت به baseline
float ALARM_ACCEL_DELTA_THR  = 0.55;   // تغییر شتاب نسبت به baseline

float FALL_TILT_THR          = 70.0;   // زاویه افتادن موتور
float CRASH_ACCEL_THR        = 5.5;    // شوک شدید
float CRASH_GYRO_THR         = 180.0;  // چرخش سریع

// confirmation
uint8_t theftDetectCount = 0;
uint8_t crashDetectCount = 0;

const uint8_t THEFT_CONFIRM_COUNT = 7;
const uint8_t CRASH_CONFIRM_COUNT = 1;

const unsigned long MPU_IGNORE_AFTER_MODE_CHANGE_MS = 3000;
const unsigned long THEFT_ALARM_REPEAT_MS = 2000;

const int THEFT_REQUIRED_COUNT = 5;
const int THEFT_CLEAR_REQUIRED_COUNT = 20;

const float THEFT_ACCEL_THRESHOLD_G = 0.65;
const float THEFT_TILT_THRESHOLD_DEG = 33.0;


int theftClearCount = 0;
unsigned long lastTheftAlarmAt = 0;

// ---------------- GPS ----------------
HardwareSerial gpsSerial(1);
TinyGPSPlus gps;
double gpsLat = 0, gpsLon = 0;
double gpsSpeed = 0;
int gpsSat = 0;
int gpsAlt = 0;

// ---------------- RELAYS ----------------
#define RELAY_FUEL_PIN     15
#define RELAY_LIGHT_PIN    27
#define BUTTON_AP 14
const int LDR_PIN = 34;   // نمونه، مطابق سیم‌کشی خودت تنظیم کن
const int LDR_DARK_THRESHOLD  = 800;    // تاریکی قطعی
const int LDR_LIGHT_THRESHOLD = 1100;   // روشنایی قطعی
const unsigned long LDR_DEBOUNCE_MS = 4000;
bool headlightState = false;  // false=خاموش، true=روشن

int lastStableLDRState = -1;  // -1 نامشخص، 0 روشنایی، 1 تاریکی
int pendingLDRState = -1;
unsigned long ldrStateChangeTime = 0;

bool relayFuelState  = true;
bool relayLightState = false;

bool forcePublish = false;

// ------------------------------
//    SIMPLE UPTIME
// ------------------------------
String getUptimeString() {
    unsigned long sec = millis() / 1000;
    unsigned long m = sec / 60;
    sec %= 60;
    return String(m) + "m " + String(sec) + "s";
}

// ------------------------------
//    SAFE MQTT PUBLISH
// ------------------------------
bool safePublish(const char* topic, const char* payload) {
    if (!mqtt->connected()) return false;
    return mqtt->publish(topic, payload, true);    // ✅ retain=true
}

// ------------------------------
//           SETUP
// ------------------------------
void setup() {
    Serial.begin(115200);
    Wire.begin();
    initSD();
    sht20.initSHT20();
    delay(100);
    sht20.checkSHT20();
    // ---- RELAYS ----
    pinMode(RELAY_FUEL_PIN, OUTPUT);
    pinMode(RELAY_LIGHT_PIN, OUTPUT);
    pinMode(LDR_PIN, INPUT);
    pinMode(BUTTON_AP, INPUT_PULLUP);

    digitalWrite(RELAY_FUEL_PIN, HIGH);
    digitalWrite(RELAY_LIGHT_PIN, HIGH);   // خاموش اولیه
    //-------------- Storage Access -------------------
prefs.begin("config", false);
loadMPUBaseline();

deviceName = prefs.getString("device_name", "KM01");

// 📡 بخوان از حافظه تنظیمات قبلی
String ssid = prefs.getString("wifi_ssid", "Asiatech");
String pass = prefs.getString("wifi_pass", "@11121314@");
mqttServer = prefs.getString("mqtt", "");
mqttPort   = prefs.getInt("port", 1883);
temp_offset = prefs.getFloat("temp_offset", 0.0f);
hum_offset  = prefs.getFloat("hum_offset", 0.0f);

if (ssid.length() > 0) {
    WiFi.begin(ssid.c_str(), pass.c_str());
    unsigned long t0 = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - t0 < 6000) {
        delay(200);
    }
}

// اگر وصل نشد → برو به حالت AP Portal
if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi FAIL → Starting AP Portal");
    startAccessPoint();
    return;
}

    // ---- WiFi ----
    //WiFi.begin("Asiatech", "@11121314@");
    unsigned long t0 = millis();

    while (WiFi.status() != WL_CONNECTED && millis() - t0 < 6000) {
        delay(200);
    }

// If fail → go AP
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi FAIL → Starting AP");
        startAccessPoint();
        return;
    }

    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
        delay(300);
    }
    Serial.println("WiFi connected.");
setupOTA();

    // ---- MQTT (pointer-based) ----
    mqtt = new PubSubClient(espClient);
    mqtt->setServer(mqttServer.c_str(), mqttPort);
    mqtt->setCallback(mqttCallback);
    mqtt->setBufferSize(1024);
    mqtt->setKeepAlive(15);
    mqtt->setSocketTimeout(2);

    // ---- MPU ----
    Serial.println("Initializing MPU6050...");
    wakeSensor(MPU_ADDRESS);
    delay(800);

    calculateGyroOffset(MPU_ADDRESS, gyroOffsetX, gyroOffsetY, gyroOffsetZ);
    calculateAccelOffset(MPU_ADDRESS, accelOffsetX, accelOffsetY);

    Serial.println("MPU6050 ready.");

    // ---- GPS ----
    gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
    Serial.println("GPS ready.");
}

// ------------------------------
//           LOOP
// ------------------------------
void loop() {
    ArduinoOTA.handle();

 handleButton();
     if (otaBusy) {
        delay(2);
        return;
    }
     // ─── ۱. بررسی دکمه AP ───────────────
    // if (digitalRead(BUTTON_AP) == LOW) {
    //     unsigned long t = millis();
    //     while (digitalRead(BUTTON_AP) == LOW) {
    //         if (millis() - t > 3000) {
    //             Serial.println("AP Button Pressed → Starting AP Portal");
    //             startAccessPoint();
    //             return;
    //         }
    //     }
    // }

    // ─── ۲. اگر در حالت AP هستیم فقط وب‌سرور اجرا شود ───────────────
    if (apMode) {
        server.handleClient();
        return;   // جلوگیری از اجرای MQTT و سنسورها
    }

    // ─── ۳. حالت نرمال ───────────────
    mqtt->loop();

    if (!mqtt->connected()) {
        reconnectMQTT();
    }

    handleMPU();
    handleGPS();
    handleLDR();
    readSHT20(temperature, humidity);

    if (forcePublish) {
        publishMPU();
        forcePublish = false;
    }

    if (millis() - lastPublish > 2000) {
        publishMPU();
        lastPublish = millis();
    }
}


// ------------------------------
//           MPU READ
// ------------------------------
void handleMPU() {
    if (!alarmArmed && gpsSpeed > 5)
    return;

    if (millis() - lastMpuCompute < MPU_INTERVAL) return;
    lastMpuCompute = millis();

    readGyroData(MPU_ADDRESS, rawGX, rawGY, rawGZ);
    rawGyroToDPS(rawGX, rawGY, rawGZ, dpsX, dpsY, dpsZ);

    dpsX -= gyroOffsetX;
    dpsY -= gyroOffsetY;
    dpsZ -= gyroOffsetZ;

    dpsToAngles(dpsX, dpsY, dpsZ, pitchG, rollG, yawG);

    readAccelData(MPU_ADDRESS, rawAX, rawAY, rawAZ);
    rawAccelToGForce(rawAX, rawAY, rawAZ, gX, gY, gZ);

    calculateAnglesFromAccel(gX, gY, gZ, pitchA, rollA);

    pitchA -= accelOffsetX;
    rollA  -= accelOffsetY;

    const float a = 0.03;
    fPitch = fPitch * (1 - a) + pitchG * a;
    fRoll  = fRoll  * (1 - a) + rollG * a;
    fYaw   = fYaw   * (1 - a) + yawG  * a;

if (millis() < ignoreMpuUntil) {
    mpuEvent = alarmArmed ? "armed_stabilizing" : "normal_stabilizing";
    logMPU(gX, gY, gZ, dpsX, dpsY, dpsZ);
    return;
}

if (alarmArmed) {
    detectTheftMotion();
    mpuEvent = theftAlarmSent ? "theft_motion" : "armed";
} else {
    detectCrashOrFall();

    if (crashAlarmSent) {
        mpuEvent = "crash_or_fall";
    } else {
        mpuEvent = "normal";
    }
}


    logMPU(gX, gY, gZ, dpsX, dpsY, dpsZ);
}


// ------------------------------
//        PUBLISH JSON
// ------------------------------
void publishMPU() {

    if (!mqtt->connected()) {
        Serial.println("MQTT not connected. Skip publish.");
        return;
    }

    StaticJsonDocument<768> doc;

    doc["mpu"]["event"] = mpuEvent;
    doc["mpu"]["pitch"] = serialized(String(fPitch, 2));
    doc["mpu"]["roll"]  = serialized(String(fRoll, 2));
    doc["mpu"]["yaw"]   = serialized(String(fYaw, 2));

    doc["mpu"]["ax"] = serialized(String(gX, 3));
    doc["mpu"]["ay"] = serialized(String(gY, 3));
    doc["mpu"]["az"] = serialized(String(gZ, 3));

    doc["gps"]["lat"]   = gpsLat;
    doc["gps"]["lon"]   = gpsLon;
    doc["gps"]["speed"] = gpsSpeed;
    doc["gps"]["sat"]   = gpsSat;
    doc["gps"]["alt"]   = gpsAlt;

    doc["relay"]["fuel"]  = relayFuelState  ? "ON" : "OFF";
    doc["relay"]["light"] = relayLightState ? "ON" : "OFF";

    doc["SHT20"]["temp"]  = temperature;
    doc["SHT20"]["hum"]   = humidity;

    doc["transport"] = "wifi";
    doc["uptime"]    = getUptimeString();
    doc["code"]      = "2611651846";
    doc["wifi"]  = WiFi.RSSI();

char buffer[1024];
size_t len = serializeJson(doc, buffer);

// اندازه JSON قبل از ارسال
size_t jsonSize = measureJson(doc);
Serial.printf("JSON Size = %d bytes\n", jsonSize);

bool ok = mqtt->publish(TOPIC_STATE, buffer, true);
if (!ok) {
    Serial.print("Publish FAILED. MQTT state=");
    Serial.println(mqtt->state());
}
logMQTT("published");


}

// ------------------------------
//       CONNECT TO MQTT
// ------------------------------
void reconnectMQTT() {
    static unsigned long lastAttempt = 0;

    if (mqtt->connected()) return;
    if (millis() - lastAttempt < 3000) return;
    lastAttempt = millis();

    Serial.print("Connecting to MQTT... ");

    if (mqtt->connect(MQTT_CLIENT, MQTT_USER_, MQTT_PASS_)) {
        Serial.println("connected");
        mqtt->subscribe(TOPIC_RELAY_CMD);
        mqtt->subscribe(TOPIC_MPU_CMD);
    } else {
        Serial.print("failed rc=");
        Serial.println(mqtt->state());
    }
}




// ------------------------------
// GPS
// ------------------------------
void handleGPS() {
    while (gpsSerial.available() > 0) {
        gps.encode(gpsSerial.read());
    }

    if (gps.location.isValid()) {
        gpsLat = gps.location.lat();
        gpsLon = gps.location.lng();
    }
    if (gps.speed.isValid()) {
        gpsSpeed = gps.speed.kmph();
    }
    if (gps.satellites.isValid()) {
        gpsSat = gps.satellites.value();
    }
    if (gps.altitude.isValid()) {
        gpsAlt = gps.altitude.meters();
    }
    logGPS(gpsLat, gpsLon, gpsAlt, gpsSpeed);

}

// ------------------------------
// MQTT CALLBACK
// ------------------------------
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (unsigned int i = 0; i < length; i++)
        message += (char)payload[i];

    message.trim();
    message.toUpperCase();

    Serial.print("Got topic: ");
    Serial.println(topic);
    Serial.print("Got payload: ");
    Serial.println(message);

    if (strcmp(topic, TOPIC_RELAY_CMD) == 0) {
        if (message.indexOf("ON") >= 0) {
            setFuelRelay(true);
        }
        else if (message.indexOf("OFF") >= 0) {
            setFuelRelay(false);
        }
    }

    if (String(topic) == "home/esp32-gps/mpu/cmd") {

        String cmd = "";

        StaticJsonDocument<128> doc;
        DeserializationError err = deserializeJson(doc, message);

        if (!err) {
            cmd = doc["COMMAND"] | "";
        } else {
            cmd = message;
        }

        cmd.trim();
        cmd.toUpperCase();

        if (cmd == "DISARM") {
            disarmMotionAlarm();
        }
        else if (cmd == "ARM") {
            armMotionAlarm();
        }
    }

}



//-------------Relay Functions---------------------
void setFuelRelay(bool state) {
    if (relayFuelState == state) return;
    forcePublish = true;

    relayFuelState = state;
    digitalWrite(RELAY_FUEL_PIN, state ? HIGH : LOW);

    Serial.printf("[RELAY] Fuel: %s\n", state ? "ON" : "OFF");
    logRelay("fuel", state);

}

void setLightRelay(bool state) {
    if (relayLightState == state) return;
    forcePublish = true;

    relayLightState = state;
    digitalWrite(RELAY_LIGHT_PIN, state ? LOW : HIGH);


    Serial.printf("[RELAY] Light: %s\n", state ? "ON" : "OFF");
    logRelay("light", state);

}

void handleLDR() {
    int ldrValue = analogRead(LDR_PIN);

    int currentZone = -1;
    // 1 = تاریک
    // 0 = روشن
    // -1 = ناحیه میانی

    if (ldrValue < LDR_DARK_THRESHOLD) {
        currentZone = 1;
    } 
    else if (ldrValue > LDR_LIGHT_THRESHOLD) {
        currentZone = 0;
    } 
    else {
        currentZone = -1;
    }

    // اگر در ناحیه میانی بود، هیچ تصمیم جدیدی نگیر
    if (currentZone == -1) {
        pendingLDRState = -1;
        ldrStateChangeTime = 0;
        return;
    }

    // اگر وضعیت فعلی با وضعیت پایدار قبلی فرق دارد
    if (currentZone != lastStableLDRState) {
        // اگر تازه این تغییر دیده شده
        if (pendingLDRState != currentZone) {
            pendingLDRState = currentZone;
            ldrStateChangeTime = millis();
        } 
        else {
            // اگر این تغییر به اندازه کافی پایدار مانده
            if (millis() - ldrStateChangeTime >= LDR_DEBOUNCE_MS) {
                lastStableLDRState = currentZone;

                if (lastStableLDRState == 1 && !headlightState) {
                    headlightState = true;
                    digitalWrite(RELAY_LIGHT_PIN, HIGH);   // اگر رله active-high است
                    Serial.println("چراغ روشن شد - هوا تاریک است");
                } 
                else if (lastStableLDRState == 0 && headlightState) {
                    headlightState = false;
                    digitalWrite(RELAY_LIGHT_PIN, LOW);    // اگر رله active-high است
                    Serial.println("چراغ خاموش شد - هوا روشن است");
                }

                pendingLDRState = -1;
                ldrStateChangeTime = 0;
            }
        }
    } 
    else {
        // اگر وضعیت همان وضعیت پایدار قبلی است، pending را پاک کن
        pendingLDRState = -1;
        ldrStateChangeTime = 0;
    }

    Serial.print("LDR Value: ");
    Serial.print(ldrValue);
    Serial.print(" | Stable State: ");
    Serial.print(lastStableLDRState);
    Serial.print(" | Headlight: ");
    Serial.println(headlightState ? "ON" : "OFF");
}

// ========== AP Portal (Kabir Motor) ==========

void startAccessPoint() {
    apMode = true;

    WiFi.disconnect(true);
    WiFi.mode(WIFI_AP);

    String apName = "KabirMotor-" + deviceName;
    WiFi.softAP(apName.c_str(), "12345678");

    IPAddress ip = WiFi.softAPIP();
    Serial.print("Access Point IP: ");
    Serial.println(ip);

    startPortalServer();
}

// ---------------------------------------------
// Single-page Setup Portal
// ---------------------------------------------
void startPortalServer() {
    server.on("/", handlePortalPage);
    server.on("/save", HTTP_POST, handlePortalSave);
    server.on("/download", handleFileDownload);
    server.on("/calibrate_mpu", HTTP_POST, handleMPUCalibration);

    server.on("/ota", HTTP_GET, handleOTAUploadPage);
    server.on("/update", HTTP_POST,
        []() {
            server.sendHeader("Connection", "close");
            server.send(200, "text/html; charset=UTF-8",
                        Update.hasError()
                        ? "<h2 style='font-family:Arial;text-align:center;margin-top:40px;color:red;'>OTA Update Failed</h2>"
                        : "<h2 style='font-family:Arial;text-align:center;margin-top:40px;color:green;'>OTA Update Success. Rebooting...</h2>");
            delay(1000);
            ESP.restart();
        },
        handleOTAUpdate
    );

    server.begin();
    Serial.println("[WEB] Portal server started");
}


// ---------------------------------------------
// صفحهٔ تنظیمات با فرم واحد و CSS
// ---------------------------------------------
void handlePortalPage() {

    String ssid  = prefs.getString("wifi_ssid", "");
    String pass  = prefs.getString("wifi_pass", "");
    String mqtt  = prefs.getString("mqtt", "");
    int    port  = prefs.getInt("port", 1883);

    float tOff = prefs.getFloat("temp_offset", 0.0f);
    float hOff = prefs.getFloat("hum_offset", 0.0f);

    String page = R"=====(
<!DOCTYPE html>
<html lang="fa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Kabir Motor Setup</title>

<style>
    body {
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #1e88e5, #42a5f5);
        font-family: Vazirmatn, Arial, sans-serif;
        color: #333;
    }

    .card {
        background: #fff;
        max-width: 430px;
        margin: 45px auto;
        padding: 28px;
        border-radius: 16px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
        animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(15px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    h2 {
        text-align: center;
        margin-bottom: 25px;
        font-size: 22px;
        color: #1976d2;
    }

    label {
        font-size: 14px;
        font-weight: bold;
        margin-top: 12px;
        display: block;
    }

    input {
        width: 100%;
        padding: 10px;
        margin-top: 6px;
        border-radius: 8px;
        border: 1px solid #bbb;
        font-size: 15px;
        transition: 0.25s;
        box-sizing: border-box;
    }

    input:focus {
        border-color: #1e88e5;
        box-shadow: 0 0 6px rgba(30,136,229,0.35);
        outline: none;
    }

    .btn {
        width: 100%;
        padding: 12px;
        background: #1e88e5;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 17px;
        margin-top: 20px;
        cursor: pointer;
        transition: 0.25s;
    }

    .btn:hover {
        background: #1565c0;
    }

    .logo {
        display: block;
        width: 120px;
        margin: 0 auto 15px;
    }

    .section-title {
        margin-top: 25px;
        margin-bottom: 10px;
        padding-bottom: 5px;
        border-bottom: 2px solid #1e88e5;
        font-size: 15px;
        font-weight: bold;
        color: #1565c0;
    }

    .info-box {
        background:#f6f8fa;
        border:1px solid #d0d7de;
        border-radius:8px;
        padding:12px;
        margin-top:10px;
        font-size:14px;
        line-height:1.8;
    }

    .warn-box {
        background:#fff3cd;
        color:#856404;
        padding:12px;
        border-radius:8px;
        margin-top:10px;
        margin-bottom:12px;
        font-size:14px;
        line-height:1.8;
    }

    .mini {
        font-size:13px;
        color:#555;
    }
</style>

</head>
<body>

<div class="card">
    <img src="data:image/png;base64,LOGO_BASE64_HERE" class="logo">
    <h2>پیکربندی دستگاه کبیر موتور</h2>

    <form method="POST" action="/save">
)=====";

    page +=
        "<label>نام شبکه WiFi:</label>"
        "<input name='ssid' value='" + ssid + "' required>"

        "<label>رمز عبور WiFi:</label>"
        "<input name='pass' value='" + pass + "' type='password'>"

        "<div class='section-title'>MQTT تنظیمات</div>"

        "<label>آدرس MQTT Server:</label>"
        "<input name='mqtt' value='" + mqtt + "' required>"

        "<label>پورت MQTT:</label>"
        "<input name='port' type='number' value='" + String(port) + "' required>"

        "<div class='section-title'>کالیبراسیون سنسور SHT20</div>"

        "<label>Temperature Offset (°C):</label>"
        "<input name='temp_offset' type='number' step='0.1' value='" + String(tOff) + "'>"

        "<label>Humidity Offset (%):</label>"
        "<input name='hum_offset' type='number' step='0.1' value='" + String(hOff) + "'>"

        "<button class='btn' type='submit'>ذخیره و راه‌اندازی مجدد</button>";

    page += "</form>";

    page += "<div class='section-title'>تنظیم صفر MPU</div>";
    page += "<div class='warn-box'>"
            "موتور را در وضعیت صحیح و کاملاً ثابت قرار دهید، سپس دکمه زیر را بزنید تا موقعیت فعلی به عنوان صفر MPU ذخیره شود."
            "</div>";

    if (mpuBaselineStored) {
        page += "<div class='info-box'>";
        page += "<b>Baseline فعلی:</b><br>";
        page += "Pitch: " + String(basePitch, 2) + "<br>";
        page += "Roll: " + String(baseRoll, 2) + "<br>";
        page += "AX: " + String(baseAX, 3) + "<br>";
        page += "AY: " + String(baseAY, 3) + "<br>";
        page += "AZ: " + String(baseAZ, 3);
        page += "</div>";
    } else {
        page += "<div class='info-box' style='color:#b00020;'>";
        page += "هنوز baseline ذخیره‌شده‌ای برای MPU ثبت نشده است.";
        page += "</div>";
    }

    page +=
        "<form method='POST' action='/calibrate_mpu'>"
        "<button class='btn' type='submit'>تنظیم موقعیت فعلی به عنوان صفر MPU</button>"
        "</form>";
page += "<div class='section-title'>بروزرسانی Firmware</div>";
page += "<div class='info-box'>";
page += "برای بروزرسانی نرم‌افزار دستگاه می‌توانید فایل باینری جدید را از طریق OTA آپلود کنید.";
page += "</div>";
page += "<form method='GET' action='/ota'>";
page += "<button class='btn' type='submit'>ورود به صفحه OTA Update</button>";
page += "</form>";

    if (sdReady) {
        page += "<div class='section-title'>فایل‌های SD</div>";
        page += getFileListHTML();
    }

    page += "</div></body></html>";

    server.send(200, "text/html; charset=UTF-8", page);
}

// ---------------------------------------------
// هندلر ذخیره تنظیمات و ریبوت
// ---------------------------------------------
void handlePortalSave() {

    String ssid  = server.arg("ssid");
    String pass  = server.arg("pass");
    String mqtt  = server.arg("mqtt");
    int    port  = server.arg("port").toInt();

    float tOff = server.arg("temp_offset").toFloat();
    float hOff = server.arg("hum_offset").toFloat();

    Serial.println("[PORTAL] Saving configuration...");
    Serial.println("SSID: " + ssid);
    Serial.println("PASS: " + pass);
    Serial.println("MQTT: " + mqtt);
    Serial.println("PORT: " + String(port));
    Serial.println("TEMP_OFFSET: " + String(tOff));
    Serial.println("HUM_OFFSET : " + String(hOff));

    prefs.putString("wifi_ssid", ssid);
    prefs.putString("wifi_pass", pass);
    prefs.putString("mqtt", mqtt);
    prefs.putInt("port", port);
    prefs.putFloat("temp_offset", tOff);
    prefs.putFloat("hum_offset", hOff);

    server.send(200, "text/html",
    R"=====(
        <html>
        <body style='font-family:Arial;text-align:center;padding-top:40px'>
            <h2>تنظیمات با موفقیت ذخیره شد</h2>
            <p>در حال راه‌اندازی مجدد...</p>
        </body>
        </html>
    )=====");

    delay(1200);
    ESP.restart();
}

void initSD() {
    if (!SD.begin(SD_CS)) {
        Serial.println("[SD] SD Card FAILED");
        sdReady = false;
        return;
    }
    Serial.println("[SD] SD Card Ready");
    sdReady = true;
}

void writeCSV(const char* filename, const String& line) {
    if (!sdReady) return;
    File f = SD.open(filename, FILE_APPEND);
    if (!f) return;
    f.println(line);
    f.close();
}
void logGPS(float lat, float lon, float alt, float speed) {
    String row = String(millis()) + "," +
                 String(lat, 6) + "," +
                 String(lon, 6) + "," +
                 String(alt, 2) + "," +
                 String(speed, 2);

    writeCSV("/gps.csv", row);
}
void logMPU(float ax, float ay, float az, float gx, float gy, float gz) {
    String row = String(millis()) + "," +
                 String(ax,2) + "," + String(ay,2) + "," + String(az,2) + "," +
                 String(gx,2) + "," + String(gy,2) + "," + String(gz,2);

    writeCSV("/mpu.csv", row);
}
void logRelay(const char* name, bool state) {
    String row = String(millis()) + "," + name + "," + (state?"1":"0");
    writeCSV("/relay.csv", row);
}
void logMQTT(const String& event) {
    String row = String(millis()) + "," + event;
    writeCSV("/mqtt.csv", row);
}
void logSystem(const String& txt) {
    String row = String(millis()) + "," + txt;
    writeCSV("/system.csv", row);
}
void handleFileDownload() {
    if (!server.hasArg("f")) {
        server.send(400, "text/plain", "No file");
        return;
    }

    String fname = "/" + server.arg("f");

    if (!SD.exists(fname.c_str())) {
        server.send(404, "text/plain", "File Not Found");
        return;
    }

    File f = SD.open(fname.c_str());
    server.streamFile(f, "text/csv");
    f.close();
}
String getFileListHTML()
{
    if (!sdReady) return "<p>SD Card not detected</p>";

    String html = "<h3>SD Card Files</h3>";

    File root = SD.open("/");
    File file = root.openNextFile();

    while (file) {

        String name = file.name();

        html += "<div style='margin:6px 0'>";
        html += name;
        html += " <a href='/download?f=" + name + "'>";
        html += "<button>Download</button></a>";
        html += "</div>";

        file = root.openNextFile();
    }

    return html;
}
void readSHT20(float &temperature, float &humidity)
{
    temperature = sht20.readTemperature() + temp_offset;
    humidity    = sht20.readHumidity() + hum_offset;
}
void handleOTAUploadPage() {
    String page = R"=====(
<!DOCTYPE html>
<html lang="fa">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OTA Update</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background: #f5f7fb;
        margin: 0;
        padding: 0;
    }
    .card {
        max-width: 420px;
        margin: 50px auto;
        background: #fff;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.12);
    }
    h2 {
        text-align: center;
        color: #1976d2;
    }
    input[type=file] {
        width: 100%;
        margin-top: 15px;
        margin-bottom: 15px;
    }
    .btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background: #1976d2;
        color: white;
        font-size: 16px;
        cursor: pointer;
    }
    .btn:hover {
        background: #1258a8;
    }
    .note {
        font-size: 13px;
        color: #555;
        line-height: 1.8;
        margin-top: 12px;
    }
    .back {
        display:block;
        margin-top:15px;
        text-align:center;
        text-decoration:none;
        color:#1976d2;
    }
</style>
</head>
<body>
    <div class="card">
        <h2>بروزرسانی OTA</h2>
        <form method="POST" action="/update" enctype="multipart/form-data">
            <input type="file" name="update" accept=".bin" required>
            <button class="btn" type="submit">آپلود و بروزرسانی</button>
        </form>
        <div class="note">
            فایل باینری firmware را انتخاب کنید.  
            بعد از اتمام آپلود، دستگاه به صورت خودکار ریست می‌شود.
        </div>
        <a class="back" href="/">بازگشت به پورتال</a>
    </div>
</body>
</html>
)=====";

    server.send(200, "text/html; charset=UTF-8", page);
}

//========== new mpu func ============
void armMotionAlarm() {
    if (!mpuBaselineStored) {
        Serial.println("[MPU] No stored baseline found, capturing temporary baseline...");
        captureMPUBaseline();
    } else {
        Serial.println("[MPU] Using stored baseline for theft detection");
        Serial.printf("[MPU] Stored baseline => Pitch: %.2f | Roll: %.2f | AX: %.3f | AY: %.3f | AZ: %.3f\n",
                      basePitch, baseRoll, baseAX, baseAY, baseAZ);
    }

    alarmArmed = true;

    theftAlarmSent = false;
    theftDetectCount = 0;
    theftClearCount = 0;

    crashAlarmSent = false;
    crashDetectCount = 0;

    ignoreMpuUntil = millis() + MPU_IGNORE_AFTER_MODE_CHANGE_MS;
    lastTheftAlarmAt = 0;

    Serial.println("[MPU] Theft alarm ARMED - Crash/Fall disabled");

    StaticJsonDocument<128> doc;
    doc["mode"] = "armed";
    doc["theft"] = "enabled";
    doc["crash"] = "disabled";

    char buf[128];
    serializeJson(doc, buf);
    mqtt->publish(TOPIC_MPU_STATUS, buf, true);
}


void disarmMotionAlarm() {
    alarmArmed = false;

    theftAlarmSent = false;
    theftDetectCount = 0;
    theftClearCount = 0;

    crashAlarmSent = false;
    crashDetectCount = 0;

    ignoreMpuUntil = millis() + MPU_IGNORE_AFTER_MODE_CHANGE_MS;

    Serial.println("[MPU] Theft alarm DISARMED - Crash/Fall enabled");

    StaticJsonDocument<128> doc;
    doc["mode"] = "disarmed";
    doc["theft"] = "disabled";
    doc["crash"] = "enabled";

    char buf[128];
    serializeJson(doc, buf);
    mqtt->publish(TOPIC_MPU_STATUS, buf, true);
}


void detectTheftMotion() {
    float pitchDiff = abs(pitchA - basePitch);
    float rollDiff  = abs(rollA - baseRoll);

    float axDiff = abs(gX - baseAX);
    float ayDiff = abs(gY - baseAY);
    float azDiff = abs(gZ - baseAZ);

    bool tiltDetected =
        pitchDiff > THEFT_TILT_THRESHOLD_DEG ||
        rollDiff  > THEFT_TILT_THRESHOLD_DEG;

    bool accelDetected =
        axDiff > THEFT_ACCEL_THRESHOLD_G ||
        ayDiff > THEFT_ACCEL_THRESHOLD_G ||
        azDiff > THEFT_ACCEL_THRESHOLD_G;

    bool theftDetected =
    (tiltDetected && accelDetected) ||
    (tiltDetected && pitchDiff > 25);


    if (theftDetected) {
        theftDetectCount++;
        theftClearCount = 0;
    } else {
        theftDetectCount = 0;

        if (theftAlarmSent) {
            theftClearCount++;

            if (theftClearCount >= THEFT_CLEAR_REQUIRED_COUNT) {
                theftAlarmSent = false;
                theftClearCount = 0;
                Serial.println("[MPU] Theft alarm cleared");
            }
        }
    }

    if (theftDetectCount >= THEFT_REQUIRED_COUNT) {
        unsigned long now = millis();

        if (!theftAlarmSent || now - lastTheftAlarmAt >= THEFT_ALARM_REPEAT_MS) {
            theftAlarmSent = true;
            lastTheftAlarmAt = now;

            Serial.println("[MPU] Theft motion detected!");

            StaticJsonDocument<256> doc;
            doc["event"] = "theft_motion";
            doc["mode"] = "armed";
            doc["pitchDiff"] = pitchDiff;
            doc["rollDiff"] = rollDiff;
            doc["axDiff"] = axDiff;
            doc["ayDiff"] = ayDiff;
            doc["azDiff"] = azDiff;

            char buf[256];
            serializeJson(doc, buf);

            mqtt->publish(TOPIC_MPU_theft, buf, false);
        }

        theftDetectCount = THEFT_REQUIRED_COUNT - 1;

    }
}

void detectCrashOrFall() {
    float accelMag = sqrt(gX*gX + gY*gY + gZ*gZ);
    float gyroMag  = sqrt(dpsX*dpsX + dpsY*dpsY + dpsZ*dpsZ);

    bool hardShock = accelMag > CRASH_ACCEL_THR;
    bool hardTilt  = abs(pitchA) > FALL_TILT_THR || abs(rollA) > FALL_TILT_THR;
    bool hardSpin  = gyroMag > CRASH_GYRO_THR;

    bool crashDetected = (hardShock && hardSpin) || hardTilt;

    if (crashDetected) {
        if (crashDetectCount < 255) crashDetectCount++;
    } else {
        crashDetectCount = 0;
        crashAlarmSent = false;   // امکان تشخیص مجدد بعداً
    }

    if (crashDetectCount >= CRASH_CONFIRM_COUNT && !crashAlarmSent) {
        crashAlarmSent = true;

        StaticJsonDocument<256> doc;
        doc["event"] = hardTilt ? "fall" : "crash";
        doc["pitch"] = pitchA;
        doc["roll"]  = rollA;
        doc["ax"]    = gX;
        doc["ay"]    = gY;
        doc["az"]    = gZ;
        doc["gyro"]  = gyroMag;
        doc["speed"] = gpsSpeed;
        doc["lat"]   = gpsLat;
        doc["lon"]   = gpsLon;

        char buf[256];
        serializeJson(doc, buf);
        mqtt->publish(TOPIC_MPU_CRASH, buf, true);

        Serial.println("[MPU] Crash/Fall detected!");
    }
}

void captureMPUBaseline() {
    float sumPitch = 0, sumRoll = 0;
    float sumAX = 0, sumAY = 0, sumAZ = 0;

    const int n = 40;
    for (int i = 0; i < n; i++) {
        readAccelData(MPU_ADDRESS, rawAX, rawAY, rawAZ);
        rawAccelToGForce(rawAX, rawAY, rawAZ, gX, gY, gZ);
        calculateAnglesFromAccel(gX, gY, gZ, pitchA, rollA);

        sumPitch += pitchA;
        sumRoll  += rollA;
        sumAX += gX;
        sumAY += gY;
        sumAZ += gZ;
        delay(15);
    }

    basePitch = sumPitch / n;
    baseRoll  = sumRoll  / n;
    baseAX    = sumAX / n;
    baseAY    = sumAY / n;
    baseAZ    = sumAZ / n;
}

void handleButton() {
  bool buttonNow = digitalRead(BUTTON_AP);

  // شروع فشار
  if (buttonPrev == HIGH && buttonNow == LOW) {
    buttonPressedAt = millis();
    longPressHandled = false;
  }

  // در حال نگه داشتن
  if (buttonNow == LOW && !longPressHandled) {
    if (millis() - buttonPressedAt >= LONG_PRESS_MS) {
      longPressHandled = true;
      Serial.println("Button long press -> start setup AP");
      startAccessPoint();   // اگر حالت AP تنظیمات مدنظر شماست
    }
  }

  // رها شدن دکمه
  if (buttonPrev == LOW && buttonNow == HIGH) {
    unsigned long pressDuration = millis() - buttonPressedAt;

    if (!longPressHandled && pressDuration < LONG_PRESS_MS) {
      Serial.println("Button short press -> restart");
      delay(100);
      ESP.restart();
    }
  }

  buttonPrev = buttonNow;
}

void handleMPUCalibration() {
    if (!apMode) {
        server.send(403, "text/plain", "MPU calibration is only allowed in AP mode");
        return;
    }

    bool ok = calibrateAndSaveMPUZero();

    if (ok) {
        String html;
        html += "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
        html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
        html += "<title>MPU Calibration</title></head>";
        html += "<body style='font-family:Arial;text-align:center;padding:30px;background:#f4f4f4;'>";
        html += "<div style='max-width:500px;margin:auto;background:#fff;padding:24px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.1);'>";
        html += "<h2 style='color:#1d7f3f;'>MPU baseline saved successfully</h2>";
        html += "<p>Current position has been set as zero reference.</p>";
        html += "<p><b>Pitch:</b> " + String(basePitch, 2) + "</p>";
        html += "<p><b>Roll:</b> " + String(baseRoll, 2) + "</p>";
        html += "<p><b>AX:</b> " + String(baseAX, 3) + "</p>";
        html += "<p><b>AY:</b> " + String(baseAY, 3) + "</p>";
        html += "<p><b>AZ:</b> " + String(baseAZ, 3) + "</p>";
        html += "<a href='/'><button style='padding:12px 22px;border:none;background:#007bff;color:white;border-radius:8px;cursor:pointer;'>Back to Portal</button></a>";
        html += "</div></body></html>";

        server.send(200, "text/html; charset=UTF-8", html);
    } else {
        server.send(500, "text/plain", "Calibration failed");
    }
}


void saveMPUBaseline() {
    prefs.putFloat(PREF_BASE_PITCH, basePitch);
    prefs.putFloat(PREF_BASE_ROLL,  baseRoll);
    prefs.putFloat(PREF_BASE_AX,    baseAX);
    prefs.putFloat(PREF_BASE_AY,    baseAY);
    prefs.putFloat(PREF_BASE_AZ,    baseAZ);
    prefs.putBool(PREF_BASE_VALID,  true);

    mpuBaselineStored = true;

    Serial.println("[MPU] Baseline saved to Preferences");
    Serial.printf("[MPU] Saved baseline => Pitch: %.2f | Roll: %.2f | AX: %.3f | AY: %.3f | AZ: %.3f\n",
                  basePitch, baseRoll, baseAX, baseAY, baseAZ);
}

void loadMPUBaseline() {
    mpuBaselineStored = prefs.getBool(PREF_BASE_VALID, false);

    if (!mpuBaselineStored) {
        Serial.println("[MPU] No stored baseline found");
        return;
    }

    basePitch = prefs.getFloat(PREF_BASE_PITCH, 0.0f);
    baseRoll  = prefs.getFloat(PREF_BASE_ROLL,  0.0f);
    baseAX    = prefs.getFloat(PREF_BASE_AX,    0.0f);
    baseAY    = prefs.getFloat(PREF_BASE_AY,    0.0f);
    baseAZ    = prefs.getFloat(PREF_BASE_AZ,    1.0f);

    lastAccelMag = sqrt(baseAX * baseAX + baseAY * baseAY + baseAZ * baseAZ);

    Serial.println("[MPU] Stored baseline loaded");
    Serial.printf("[MPU] Loaded baseline => Pitch: %.2f | Roll: %.2f | AX: %.3f | AY: %.3f | AZ: %.3f\n",
                  basePitch, baseRoll, baseAX, baseAY, baseAZ);
}

bool calibrateAndSaveMPUZero() {
    Serial.println("[MPU] Calibrating zero position... Keep vehicle still");

    float sumPitch = 0.0f, sumRoll = 0.0f;
    float sumAX = 0.0f, sumAY = 0.0f, sumAZ = 0.0f;

    const int samples = 60;

    for (int i = 0; i < samples; i++) {
        readAccelData(MPU_ADDRESS, rawAX, rawAY, rawAZ);
        rawAccelToGForce(rawAX, rawAY, rawAZ, gX, gY, gZ);
        calculateAnglesFromAccel(gX, gY, gZ, pitchA, rollA);

        sumPitch += pitchA;
        sumRoll  += rollA;
        sumAX    += gX;
        sumAY    += gY;
        sumAZ    += gZ;

        delay(20);
    }

    basePitch = sumPitch / samples;
    baseRoll  = sumRoll  / samples;
    baseAX    = sumAX / samples;
    baseAY    = sumAY / samples;
    baseAZ    = sumAZ / samples;

    saveMPUBaseline();

    lastAccelMag = sqrt(baseAX * baseAX + baseAY * baseAY + baseAZ * baseAZ);

    Serial.println("[MPU] Zero position calibrated and saved successfully");
    Serial.printf("[MPU] New zero => Pitch: %.2f | Roll: %.2f | AX: %.3f | AY: %.3f | AZ: %.3f\n",
                  basePitch, baseRoll, baseAX, baseAY, baseAZ);

    return true;
}
void setupOTA() {
    ArduinoOTA.setHostname(deviceName.c_str());

    ArduinoOTA.onStart([]() {
        otaBusy = true;

        String type = (ArduinoOTA.getCommand() == U_FLASH) ? "sketch" : "filesystem";
        Serial.println("[OTA] Start updating " + type);

        if (mqtt && mqtt->connected()) {
            mqtt->publish(TOPIC_STATE, "OTA Start", true);
        }
    });

    ArduinoOTA.onEnd([]() {
        Serial.println("\n[OTA] End");

        if (mqtt && mqtt->connected()) {
            mqtt->publish(TOPIC_STATE, "OTA End", true);
        }

        otaBusy = false;
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("[OTA] Progress: %u%%\r", (progress * 100) / total);
    });

    ArduinoOTA.onError([](ota_error_t error) {
        otaBusy = false;

        Serial.printf("[OTA] Error[%u]: ", error);

        if (error == OTA_AUTH_ERROR) {
            Serial.println("Auth Failed");
        } else if (error == OTA_BEGIN_ERROR) {
            Serial.println("Begin Failed");
        } else if (error == OTA_CONNECT_ERROR) {
            Serial.println("Connect Failed");
        } else if (error == OTA_RECEIVE_ERROR) {
            Serial.println("Receive Failed");
        } else if (error == OTA_END_ERROR) {
            Serial.println("End Failed");
        }

        if (mqtt && mqtt->connected()) {
            mqtt->publish(TOPIC_STATE, "OTA Error", true);
        }
    });

    ArduinoOTA.begin();

    Serial.println("[OTA] ArduinoOTA ready");
}

void handleOTAUpdate() {
    HTTPUpload& upload = server.upload();

    if (upload.status == UPLOAD_FILE_START) {
        otaBusy = true;

        Serial.printf("[OTA] Update Start: %s\n", upload.filename.c_str());

        if (mqtt && mqtt->connected()) {
            mqtt->publish(TOPIC_STATE, "Web OTA Start", true);
        }

        if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
            Update.printError(Serial);
        }
    }

    else if (upload.status == UPLOAD_FILE_WRITE) {
        if (Update.write(upload.buf, upload.currentSize) != upload.currentSize) {
            Update.printError(Serial);
        }
    }

    else if (upload.status == UPLOAD_FILE_END) {
        if (Update.end(true)) {
            Serial.printf("[OTA] Update Success: %u bytes\n", upload.totalSize);

            if (mqtt && mqtt->connected()) {
                mqtt->publish(TOPIC_STATE, "Web OTA Success", true);
            }
        } else {
            Update.printError(Serial);

            if (mqtt && mqtt->connected()) {
                mqtt->publish(TOPIC_STATE, "Web OTA Failed", true);
            }
        }

        otaBusy = false;
    }

    else if (upload.status == UPLOAD_FILE_ABORTED) {
        Update.end();

        otaBusy = false;

        Serial.println("[OTA] Update aborted");

        if (mqtt && mqtt->connected()) {
            mqtt->publish(TOPIC_STATE, "Web OTA Aborted", true);
        }
    }

    delay(0);
}

