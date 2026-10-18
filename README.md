# Smart Flood Alert — IoT Flood Telemetry & Early Warning System

[![Live Demo](https://img.shields.io/badge/Live_Demo-Smart%20Flood%20Dashboard-06b6d4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://darsheelshokeen.xo.je/smart-flood/)
[![Hardware](https://img.shields.io/badge/Hardware-ESP32%20%2B%20FC--28-orange?style=for-the-badge&logo=espressif&logoColor=white)](#)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](#)
[![Alerts](https://img.shields.io/badge/Alerts-Meta%20WhatsApp%20Cloud%20API-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

> **Smart Flood Alert** is an end-to-end IoT disaster mitigation and urban drainage monitoring system. Combining an ESP32 microcontroller and water level sensing probes with a high-throughput Python FastAPI telemetry server, interactive telemetry web dashboard, and automated emergency broadcast dispatching over the WhatsApp Meta Cloud API.

---

## 🌊 System Architecture

```
  ┌────────────────────────────────────────────────────────┐
  │                 Edge Sensing Hardware                  │
  │     ESP32 Microcontroller + FC-28 Water Sensor Probe   │
  └──────────────────────────┬─────────────────────────────┘
                             │ WiFi HTTP POST Telemetry (every 2s)
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │              Python FastAPI Ingestion Server           │
  │    • Validates ADC voltage & converts to water mm     │
  │    • Categorizes: Normal (<40mm), Warning (40-70mm),   │
  │      Critical Flood Emergency (>70mm)                  │
  └─────────────┬───────────────────────────┬──────────────┘
                │                           │
                ▼                           ▼
   ┌────────────────────────┐  ┌────────────────────────┐
   │ Real-Time Web Console  │  │ Meta WhatsApp Cloud API│
   │ Live gauges, charts,   │  │ Dispatches automated   │
   │ audio siren alert      │  │ emergency alerts to    │
   └────────────────────────┘  │ registered residents   │
                               └────────────────────────┘
```

---

## ✨ Core Features

* **⚡ Real-Time Telemetry Dashboard**: Live SVG liquid level gauges, dynamic threshold color changes (Green $\rightarrow$ Amber $\rightarrow$ Red), and historical trend charts.
* **🚨 Automated WhatsApp Emergency Broadcasts**: Triggered immediately when water crosses critical safety thresholds, notifying city administration and local residents.
* **🎛️ Interactive Simulation Mode**: Allows prospective users and evaluators to simulate flood water rising in real time via an on-screen slider without needing physical hardware connected.
* **🔊 Audio Siren & Visual Flashing Alerts**: High-visibility hazard alerts for command room monitoring screens.

---

## 📋 Requirements to Run

### Hardware Setup
* **ESP32 NodeMCU Development Board** (Wi-Fi 802.11 b/g/n enabled).
* **FC-28 / Resistance Water Depth Sensor Probe** (connected to ESP32 ADC pin `GPIO 34`).
* **Jumper Wires & 5V USB Power Source**.

### Software & API Prerequisites
* **Python 3.10+** (with `fastapi`, `uvicorn`, `requests`, `pydantic`).
* **Meta Cloud WhatsApp Business API** account (Phone Number ID & Bearer Token).
* **Modern Web Browser** for dashboard rendering.

---

## 🛠️ Code Structure

```bash
smart-flood/
├── index.html        # Telemetry dashboard, liquid level gauges, simulation controls
├── style.css         # Cyber-industrial alert dashboard styling & light/dark tokens
├── app.js            # Real-time WebSocket/Polling telemetry engine & audio alert manager
├── favicon.svg       # Vector theme-adaptive favicon
├── favicon.ico       # Multi-resolution favicon
└── README.md         # Technical documentation & circuit guides
```

---

## 🚀 Getting Started

### 1. Live Web Simulation
Try the dashboard with live telemetry and simulated water rise controls:  
👉 **[Open Smart Flood Alert Dashboard](https://darsheelshokeen.xo.je/smart-flood/)**

### 2. Local Dashboard Preview
```bash
git clone https://github.com/DarsheelShokeen/smart-flood-alert.git
cd smart-flood-alert

python -m http.server 5000
```
Visit `http://localhost:5000` to interact with the dashboard.

---

## 👤 Author

**Darsheel Shokeen**  
*Developer • Creator • Builder*  
* Website: [darsheelshokeen.xo.je](https://darsheelshokeen.xo.je)  
* GitHub: [@DarsheelShokeen](https://github.com/DarsheelShokeen)  
* LinkedIn: [Darsheel Shokeen](https://www.linkedin.com/in/darsheel-shokeen-523833302)

---

## 📄 License

Licensed under the MIT License.
