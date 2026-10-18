# CardioGuard AI Data Management & Governance

## 1. Directory Structure

```
data/
├── README.md               # Data governance, compliance, and catalog documentation
├── synthetic/              # Synthetic datasets strictly for development, testing, and CI
│   ├── README.md           # Synthetic data generation and limitations
│   └── test_cohort.json    # Deterministic test cases (zero real patient information)
└── benchmarks/             # Public de-identified research benchmarks (e.g. PhysioNet references)
```

## 2. STRICT PRIVACY & DATA PROTECTION RULES

> [!CAUTION]
> **NEVER COMMIT REAL PATIENT OR CLINICAL DATA TO THIS REPOSITORY.**
> All code in this repository must comply with global and national healthcare data protection standards:
> - **India**: Digital Personal Data Protection Act (DPDPA) 2023 & DISHA guidelines.
> - **United States**: Health Insurance Portability and Accountability Act (HIPAA) Privacy and Security Rules.
> - **European Union**: General Data Protection Regulation (GDPR) Article 9 (Special category health data).

- Any personal identifiable information (PII), protected health information (PHI), clinical medical records, or raw patient telemetry MUST NEVER be pushed to git or stored on local development drives.
- Production clinical data is handled strictly in encrypted, zero-trust cloud data stores with role-based access control (RBAC), multi-factor authentication, and strict audit logging.

## 3. Synthetic Data Policy
- The `data/synthetic/` folder contains purely synthetic or mathematically generated waveforms and vital traces.
- Synthetic records are generated with randomized, pseudo-random, or physiological model generators for test suite execution and continuous integration.
- Synthetic data MUST NOT be cited or published as clinical validation evidence.

## 4. Benchmark Datasets and Citations
Public datasets referenced for research benchmarks (accessed via institutional credentials and credentialed PhysioNet agreements):
- **PTB-XL**: A large publicly available electrocardiography dataset (Wagner et al., Scientific Data 2020; PhysioNet). CC-BY 4.0.
- **MIT-BIH Arrhythmia Database**: Moody GB, Mark RG. IEEE Eng in Med and Biol 2001; PhysioNet. Open Health Data License.
- **Framingham Heart Study**: Historical epidemiological cohorts from NIH / NHLBI BioLINCC (Accessed under approved data use agreement).
