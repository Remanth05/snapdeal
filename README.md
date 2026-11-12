# 🎙️ Snapdeal Mini AI Virtual KAM (Key Account Manager)
> **Practical Assignment Submission | AI First Intern — Snapdeal Seller Experience**  
> *Built for Sourav Chakraborty and the Snapdeal Seller Experience Team*

[![Voice First](https://img.shields.io/badge/Voice-Two--Way%20Audio-e40046.svg)](#architecture)
[![Zero Setup](https://img.shields.io/badge/Setup-Zero%20Dependencies-10b981.svg)](#quickstart)
[![Status](https://img.shields.io/badge/Status-Submission%20Ready-blue.svg)](#submission-files)

---

## 🌟 Overview & Business Context

An AI-powered Virtual Key Account Manager (Virtual KAM) designed to understand a Snapdeal seller's business, proactively diagnose revenue leaks using real store telemetry, and drive actionable business growth without requiring human intervention.

### The Problem Scenario
A seller calls the Virtual KAM and says:
> *"My sales have dropped significantly this month. I don’t understand why. Can you help me?"*

### Telemetry Analyzed:
| Metric | Last Month | This Month | Delta | Business Diagnosis |
| :--- | :--- | :--- | :--- | :--- |
| **Sales** | ₹2,00,000 | ₹1,35,000 | 🔻 **-32.5%** | Revenue deficit of ₹65,000 |
| **Orders** | 400 | 270 | 🔻 **-32.5%** | Lost 130 unfulfilled orders |
| **Cancellation Rate** | 8% | 14% | ⚠️ **+75% spike** | **Alert:** Exceeds 10% threshold, risking tier penalty |
| **Average Selling Price** | ₹500 | ₹500 | ⚖️ **0.0%** | **Healthy:** Pricing & demand are NOT the issue |
| **Out-of-Stock SKUs** | 5 | 18 | 🚨 **+260% surge** | **Smoking Gun:** 13 hero products missing |

---

## ⚡ Quickstart (Runs in 5 Seconds)

### Method 1: 1-Click Runner (Windows)
Double-click **`START_DEMO.bat`** or **`OPEN_IN_BROWSER.bat`**.

### Method 2: Command Line
```bash
python server.py
```
*(Automatically serves at `http://localhost:8000` and opens your browser)*

### Method 3: Direct Browser
Double-click **`index.html`** or drag it into **Google Chrome** or **Microsoft Edge**.

---

## 📂 Project Structure & Submission Deliverables

```
snapdeal/
├── index.html                  # Full-featured Snapdeal Virtual KAM dashboard
├── styles.css                  # Modern UI styles, Snapdeal theme & print stylesheet
├── app.js                      # Speech recognition (STT), speech synthesis (TTS) & diagnostic engine
├── server.py                   # Lightweight local server with auto-port finding
├── START_DEMO.bat              # 1-click batch runner to launch the server
├── OPEN_IN_BROWSER.bat         # 1-click batch runner to open directly in browser
├── Submission_Note.md          # 1-page official submission writeup
├── Submission_Note.pdf         # Printable submission PDF for email attachment
├── Demo_Walkthrough_Script.md  # 75-90 second video recording script
└── README.md                   # This project guide
```

---
