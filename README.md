<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:07111f,45:1565C0,100:E7352C&height=130&section=header&text=&fontSize=0&animation=twinkling&stroke=FF3B3B&strokeWidth=1" width="100%" alt="">
</p>

<p align="center">
  <a href="docs/ride.mp4">
    <img src="docs/banner.gif" alt="Kabir Motor title over a moving map" width="100%">
  </a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=22&duration=2400&pause=700&color=FF3B3B&center=true&vCenter=true&width=780&height=48&lines=Live+GPS+on+the+city+map;Theft+alarm+and+crash+detection;Fuel+relay+%C2%B7+headlights+%C2%B7+climate;Firmware+and+dashboard%2C+one+repo" alt="Rotating tagline">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/ESP32-firmware-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32">
  <img src="https://img.shields.io/badge/Next.js-dashboard-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/MQTT-live_link-660066?style=for-the-badge&logo=mqtt&logoColor=white" alt="MQTT">
  <img src="https://img.shields.io/badge/GPS-on_the_map-2E7D32?style=for-the-badge" alt="GPS">
</p>

<p align="center">
  <img src="https://skillicons.dev/icons?i=arduino,cpp,nextjs,react,ts,nodejs,docker&perline=7" alt="Arduino, C++, Next.js, React, TypeScript, Node, Docker">
</p>

<p align="center">
  One motorcycle. Two halves of the same repository.<br>
  <b><a href="kabir_motor_main_final_MPU_full.ino">Firmware</a></b>
  on the bike, and the
  <b><a href="dashboard">dashboard</a></b>
  that draws the ride.<br>
  <a href="docs/ride.mp4"><img src="https://img.shields.io/badge/▶_Play_the_ride-mp4-111111?style=for-the-badge" alt="Play the ride"></a>
</p>

## The ride

The map, the dial, and the front camera are from one recording. Click either clip to open the video.

<p align="center">
  <a href="docs/ride.mp4">
    <img src="docs/ride.gif" alt="Full dashboard during the ride" width="100%">
  </a>
</p>

<table>
  <tr>
    <td width="42%" align="center" valign="middle">
      <a href="docs/ride.mp4"><img src="docs/speed.gif" alt="Speedometer falling through the 50s" width="100%"></a>
      <br><b>Speed</b>
      <br>The arc follows GPS speed. The pill above it is the headlight.
    </td>
    <td width="58%" align="center" valign="middle">
      <a href="docs/ride.mp4"><img src="docs/camera.gif" alt="Front camera while the bike moves" width="100%"></a>
      <br><b>Front camera</b>
      <br>Live view on the map, with record under the picture.
    </td>
  </tr>
</table>

<p align="center">
  <img src="docs/screenshots/status-bar.jpg" alt="Status bar" width="92%">
</p>

<table>
  <tr>
    <td width="50%" align="center">
      <img src="docs/screenshots/climate.jpg" alt="35 degrees and 19 percent humidity" width="80%">
      <br><b>Climate</b>
      <br>SHT20 temperature and humidity, with the offsets saved in the setup portal.
    </td>
    <td width="50%" align="center">
      <img src="docs/screenshots/distance.jpg" alt="Trip distance" width="92%">
      <br><b>Distance</b>
      <br>The dashboard integrates the GPS track as the bike moves.
    </td>
  </tr>
</table>

## Garage

The dashboard ships a photo and a 3D model for each bike. These four are from the Kabir line, in `dashboard/public`.

<p align="center">
  <img src="dashboard/public/motor/KABIR%20125.png" alt="Kabir 125" width="22%">
  <img src="dashboard/public/motor/KABIR%20150.png" alt="Kabir 150" width="22%">
  <img src="dashboard/public/motor/KABIR%20200.png" alt="Kabir 200" width="22%">
  <img src="dashboard/public/motor/KABIR%20A1%20249.png" alt="Kabir A1 249" width="22%">
</p>

## How a packet becomes a picture

```mermaid
flowchart LR
  GPS[GPS] --> ESP[ESP32 sketch]
  MPU[MPU6050] --> ESP
  SHT[SHT20] --> ESP
  LDR[Light sensor] --> ESP
  ESP -->|state every 2s| MQTT[MQTT]
  MQTT --> MAP[Next.js map]
  MAP -->|ARM, DISARM, fuel| MQTT
  MQTT --> ESP
```

| On the bike | In this repo | On screen |
| --- | --- | --- |
| ESP32 sketch | `kabir_motor_main_final_MPU_full.ino` | — |
| Next.js app | `dashboard/` | Map, dial, camera, climate, alarm |
| Telemetry | `home/esp32-gps/state` | Status bar, speed, altitude |
| Theft alarm | `home/esp32-gps/mpu/cmd` | Shield button |
| Fuel relay | `relay/gr01/control` | Engine control |
| Camera stream | `dashboard/app/api/mjpeg` | Front camera card |

<details>
<summary><b>Telemetry JSON</b></summary>

<br>

Published about every 2 seconds, retained:

```json
{
  "mpu": { "event": "normal", "pitch": "0.20", "roll": "-0.10", "yaw": "3.40", "ax": "0.012", "ay": "-0.004", "az": "0.998" },
  "gps": { "lat": 0.0, "lon": 0.0, "speed": 58.0, "sat": 7, "alt": 1246 },
  "relay": { "fuel": "ON", "light": "OFF" },
  "SHT20": { "temp": 35.0, "hum": 19.0 },
  "transport": "wifi",
  "uptime": "4m 12s",
  "code": "<device-code>",
  "wifi": -61
}
```

`mpu.event` is `normal`, `armed`, `theft_motion`, or `crash_or_fall`.

</details>

<details>
<summary><b>Commands the dashboard sends</b></summary>

<br>

| Topic | Payload | Effect |
| --- | --- | --- |
| `relay/gr01/control` | `ON` or `OFF` | Fuel relay |
| `home/esp32-gps/mpu/cmd` | `{"COMMAND":"ARM"}` | Arm theft detection. Crash detection pauses. |
| `home/esp32-gps/mpu/cmd` | `{"COMMAND":"DISARM"}` | Disarm theft detection. Crash and fall detection resumes. |

Alarms publish on `home/esp32-gps/mpu/theft`, `home/esp32-gps/mpu/crash`, and `home/esp32-gps/mpu/state`.

Park the motorcycle level and still, then set the MPU zero from the setup portal so theft detection has a stored baseline.

</details>

<details>
<summary><b>Wiring</b></summary>

<br>

| Function | ESP32 pin |
| --- | --- |
| GPS RX | 16 |
| GPS TX | 17 |
| Fuel relay | 15 |
| Headlight relay | 27 |
| Setup button, input pull-up | 14 |
| Light sensor | 34 |
| SD card chip select | 5 |
| MPU6050 and SHT20 | I2C, default SDA 21 / SCL 22. MPU address `0x68` |

Hold the setup button for 3 seconds to open the `KabirMotor-<name>` access point. A short press restarts the board. Wi-Fi, the MQTT broker, and the SHT20 offsets are saved on the device from that page.

SD logs, when a card is present: `gps.csv`, `mpu.csv`, `relay.csv`, `mqtt.csv`, `system.csv`.

</details>

<details>
<summary><b>Run the dashboard</b></summary>

<br>

```bash
cd dashboard
npm install
npm run dev
```

Open `http://localhost:3000`.

`dashboard/docker-compose.yml` starts the published image on port 3000:

```bash
cd dashboard
docker compose up
```

</details>

<details>
<summary><b>Flash the firmware</b></summary>

<br>

Open `kabir_motor_main_final_MPU_full.ino` in the Arduino IDE.

Board package used for the local build: **esp32 by Espressif, core 3.3.7**, 240 MHz, 4 MB flash, 921600 upload.

Libraries the sketch includes:

- WiFiManager
- PubSubClient
- ArduinoJson
- TinyGPSPlus
- DFRobot SHT20
- A local `mpu6050` library with `wakeSensor`, `readAccelData`, `rawAccelToGForce`, `calculateAnglesFromAccel`, `calculateGyroOffset`, and `calculateAccelOffset`

Compiled files under `build/` stay on the machine that flashed the board.

</details>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:E7352C,55:1565C0,100:07111f&height=120&section=footer&text=&fontSize=0&animation=twinkling&stroke=FF3B3B&strokeWidth=1" width="100%" alt="">
</p>
