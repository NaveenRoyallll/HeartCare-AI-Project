# Heart-sound and rhythm monitoring feasibility

CardioGuard does not currently claim to diagnose disease from a phone microphone,
camera, or an unvalidated wearable signal. The following boundaries are part of
the product design.

## Built-in phone microphone

A phone microphone records airborne acoustic pressure. It does not record an
electrical ECG and is strongly affected by clothing, phone placement, speech,
room noise, handling noise, and the phone's automatic gain control. A phone
placed near the chest may capture a low-quality phonocardiogram-like signal,
but a recording alone cannot rule in or rule out myocardial infarction,
arrhythmia, valve disease, or heart failure.

Any future prototype must request microphone permission, record a short sample
only after explicit consent, display a signal-quality result, retain the source
metadata, and return “analysis unavailable” when quality is inadequate. It
must never convert a recording into a fabricated diagnosis.

## External electronic stethoscope

An electronic stethoscope can provide a more controlled acoustic signal, but
requires a supported device, connection protocol, placement instructions, and
validated labeled recordings. The integration boundary is a device SDK or
Bluetooth audio stream plus a quality assessment. No such validated device
adapter or clinical model is included in this repository.

## ECG and wearable devices

An approved ECG device measures electrical cardiac activity and is not
interchangeable with heart sounds. A wearable may provide pulse rate,
photoplethysmography, oxygen saturation, or rhythm-related features depending
on the device. Those signals can be useful for wellness monitoring or
clinician review only when the device API, timestamp, quality flags, and
calibration are available. They cannot replace emergency assessment, a
12-lead ECG, troponin testing, or imaging.

## Camera and PPG

Camera-based PPG estimates pulse-related changes in reflected light. It is
sensitive to movement, skin contact, lighting, temperature, and camera
hardware. It is not an ECG and cannot diagnose a heart attack. CardioGuard
does not currently ingest camera PPG.

## Required evidence before classification

Before adding any rhythm or heart-sound classification, the project needs:

1. A named model and license compatible with the product.
2. Representative, consented, labeled data and a documented train/test split.
3. Signal-quality rejection behavior and performance by relevant demographic
   and device groups.
4. A clinician-reviewed intended-use statement and prospective validation.
5. A regulatory review for the target jurisdiction if the feature makes a
   medical claim.

Until those requirements are met, the safe implementation is upload/recording
metadata, visualization, quality assessment, and manual clinician review—not
diagnostic inference.
