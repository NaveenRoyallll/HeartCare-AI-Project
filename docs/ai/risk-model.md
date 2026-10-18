# CardioGuard AI — Framingham Risk Score Specification

> [!CAUTION]
> **Clinical Disclaimer & Research Use Limitation**:  
> The cardiovascular risk calculation in CardioGuard AI is implemented strictly for **educational and research decision support**. It is **NOT** a diagnostic test, does not guarantee cardiovascular health, and must never replace clinical assessment by a board-certified physician or cardiologist.

---

## 1. Source Publication & Scientific Foundation

The risk scoring algorithm is based directly on the peer-reviewed clinical study:
- **Reference**: D’Agostino RB Sr, Vasan RS, Pencina MJ, Wolf PA, Cobain M, Massaro JM, Kannel WB.  
  *General Cardiovascular Risk Profile for Use in Primary Care: The Framingham Heart Study.*  
  **Circulation**, 2008; 117(6): 743–753. DOI: [10.1161/CIRCULATIONAHA.107.699579](https://doi.org/10.1161/CIRCULATIONAHA.107.699579).
- **Study Design**: Longitudinal prospective cohort study tracking participants free of cardiovascular disease (CVD) at baseline over 12 years to predict 10-year risk of primary cardiovascular events (coronary heart disease, cerebrovascular disease, peripheral artery disease, and heart failure).

---

## 2. Mathematical Model Formulation

The 10-year cardiovascular disease risk $P$ is calculated using a Cox proportional hazards model:

$$P = 1 - S_{10}^{\exp\left(\sum_{i=1}^p \beta_i X_i - \bar{M}\right)}$$

Where:
- $S_{10}$ is the baseline survival rate at 10 years:
  - **Men**: $S_{10} = 0.88936$
  - **Women**: $S_{10} = 0.95012$
- $\bar{M}$ is the mean sum of linear predictors across the reference Framingham cohort:
  - **Men**: $\bar{M} = 23.9802$
  - **Women**: $\bar{M} = 26.1931$
- $\beta_i$ are the regression coefficients for risk factors $X_i$ (using natural logarithms for continuous metrics).

---

## 3. Regression Coefficients ($\beta$)

| Variable ($X_i$) | Men ($\beta$) | Women ($\beta$) | Transformation |
|---|---|---|---|
| **Age** | $3.06117$ | $2.32888$ | $\ln(\text{Age})$ |
| **Total Cholesterol** | $1.12370$ | $1.20904$ | $\ln(\text{TC})$ |
| **HDL Cholesterol** | $-0.93263$ | $-0.70833$ | $\ln(\text{HDL})$ |
| **Systolic BP (Untreated)** | $1.93303$ | $2.76157$ | $\ln(\text{SBP})$ if `not treated` |
| **Systolic BP (Treated)** | $1.99881$ | $2.82263$ | $\ln(\text{SBP})$ if `treated` |
| **Current Smoker** | $0.65451$ | $0.52873$ | $1$ if True, $0$ if False |
| **Diabetes Mellitus** | $0.57367$ | $0.69154$ | $1$ if True, $0$ if False |

---

## 4. Input Requirements & Valid Ranges

| Parameter | Type | Valid Range | Units | Notes |
|---|---|---|---|---|
| **Age** | Integer | $30 - 79$ | Years | Outside this implementation's calibrated range, the score is not calculated. |
| **Sex** | Enum | `male` / `female` | - | Biological sex required for sex-specific hazard equations. |
| **Total Cholesterol** | Float | $130.0 - 320.0$ | mg/dL | Fasting or non-fasting serum level. |
| **HDL Cholesterol** | Float | $20.0 - 100.0$ | mg/dL | High-density lipoprotein cholesterol. |
| **Systolic BP** | Integer | $90 - 200$ | mmHg | Resting systolic blood pressure. |
| **Treated BP** | Boolean | `true` / `false` | - | Whether patient is actively on antihypertensive therapy. |
| **Smoker** | Boolean | `true` / `false` | - | Self-reported cigarette smoking within past 12 months. |
| **Diabetes** | Boolean | `true` / `false` | - | Fasting glucose $\ge 126$ mg/dL or on antidiabetic therapy. |

---

## 5. Output Stratification & Heart Age

1. **Risk Percentage**: Scaled between $0.0\%$ and $100.0\%$.
2. **Clinical Risk Categories**:
   - **Low Risk**: $< 10\%$ 10-year risk.
   - **Moderate / Intermediate Risk**: $10\% - 19.9\%$ 10-year risk.
   - **High Risk**: $\ge 20\%$ 10-year risk.
3. **Heart Age (Vascular Age)**:
   The age of a person with the same calculated risk score whose risk factors are all in the ideal/normal ranges (untreated SBP 110 mmHg, Total Cholesterol 160 mg/dL, HDL 60 mg/dL, non-smoker, non-diabetic).

---

## 6. Critical Limitations for Indian & South Asian Populations

> [!WARNING]
> **Ethnic Calibration Limitation**: The Framingham cohort consisted almost exclusively of **White/Caucasian individuals of European descent** in Framingham, Massachusetts.

1. **Underestimation in South Asians**: Extensive epidemiological research (e.g., INTERHEART, MASALA, and Indian Council of Medical Research studies) demonstrates that individuals of South Asian ancestry develop premature coronary artery disease 5–10 years earlier and have higher cardiovascular mortality at lower BMIs and lower lipid thresholds.
2. **Missing Risk Factors**: Framingham does **not** incorporate:
   - Lipoprotein(a) [$Lp(a)$] — markedly elevated in South Asians.
   - High-sensitivity C-reactive Protein (hs-CRP) or coronary artery calcium (CAC).
   - Visceral adiposity, waist-to-hip ratio, or metabolic syndrome.
   - Family history of premature coronary heart disease.
3. **Application Recommendation**: CardioGuard AI explicitly displays a caution banner for South Asian users advising that international guidelines (such as the ACC/AHA or Indian Heart Association) often recommend considering South Asian ethnicity as a clinical "risk enhancer".

---

## 7. Model Verification & Automated Test Methodology

Because this equation is fully deterministic:
- Automated unit test suites in `ai/tests/test_framingham.py` test the implementation against benchmark reference tables published in Circulation 2008.
- Exact floating point values are validated within a tolerance of $\pm 0.1\%$ risk score.
