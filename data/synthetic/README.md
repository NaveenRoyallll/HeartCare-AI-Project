# Synthetic Health Data for CardioGuard AI

> [!IMPORTANT]
> **DEVELOPMENT AND TESTING ONLY**
> All files in this directory consist entirely of artificial, simulated, or mathematically synthesized records.
> No data here represents real individuals, real hospital admissions, or authentic clinical encounters.

## Purpose
1. **Automated Unit & Integration Testing**: Ensures signal filters, anomaly detection routines, and risk calculators run deterministically across boundary conditions.
2. **Offline Algorithm Verification**: Allows continuous integration pipelines to verify code correctness without requiring access to protected clinical infrastructure.
3. **Safety Assertions**: Provides edge cases (e.g. extreme vitals, missing values, noise) to verify graceful failure and safety overrides.

## Limitations
- Synthetic data cannot be used to compute clinical performance, real-world accuracy, sensitivity, or specificity.
- Simulated ECG signals do not capture full patient biological variability, rare channelopathies, or complex pathology mixtures.
