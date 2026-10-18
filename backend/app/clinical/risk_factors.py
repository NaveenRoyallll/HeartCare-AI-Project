"""Cardiovascular risk factors definition and clinical evidence base."""
from typing import Any, Dict

CARDIOVASCULAR_RISK_FACTORS: Dict[str, Dict[str, Any]] = {
    "age_and_sex": {
        "name": "Age and Biological Sex",
        "description": "CVD risk increases progressively with advancing age. Men have earlier onset of coronary artery disease compared to premenopausal women.",
        "evidence_sources": [
            "D'Agostino RB Sr, et al. General cardiovascular risk profile for use in primary care: the Framingham Heart Study. Circulation. 2008;117(6):743-753.",
            "Grundy SM, et al. 2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol. Circulation. 2019;139(25):e1082-e1143."
        ],
        "modifiable": False,
    },
    "dyslipidemia": {
        "name": "Dyslipidemia (Elevated Total/LDL-C & Low HDL-C)",
        "description": "Elevated apolipoprotein B-containing lipoproteins (LDL, VLDL) drive atherogenesis. Low HDL-C independently predicts increased ischemic events.",
        "evidence_sources": [
            "Mach F, et al. 2019 ESC/EAS Guidelines for the management of dyslipidaemias. Eur Heart J. 2020;41(1):111-188.",
            "INTERHEART Study: Yusuf S, et al. Effect of potentially modifiable risk factors associated with myocardial infarction in 52 countries. Lancet. 2004;364(9438):937-952."
        ],
        "modifiable": True,
        "target_reference": "Total Cholesterol < 200 mg/dL, HDL > 40 mg/dL (men) or > 50 mg/dL (women)"
    },
    "hypertension": {
        "name": "Systemic Arterial Hypertension",
        "description": "High systolic and diastolic blood pressure accelerates arterial stiffness, endothelial injury, left ventricular hypertrophy, and heart failure.",
        "evidence_sources": [
            "Whelton PK, et al. 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. J Am Coll Cardiol. 2018;71(19):e127-e248."
        ],
        "modifiable": True,
        "target_reference": "Systolic < 120 mmHg, Diastolic < 80 mmHg"
    },
    "smoking": {
        "name": "Tobacco Smoking",
        "description": "Cigarette smoke induces endothelial dysfunction, platelet aggregation, coronary vasospasm, and hypercoagulability, multiplying CVD risk 2- to 3-fold.",
        "evidence_sources": [
            "US Department of Health and Human Services. The Health Consequences of Smoking—50 Years of Progress. CDC. 2014.",
            "INTERHEART Study. Lancet. 2004."
        ],
        "modifiable": True,
        "target_reference": "Complete cessation and avoidance of secondhand smoke"
    },
    "diabetes": {
        "name": "Diabetes Mellitus and Impaired Fasting Glucose",
        "description": "Diabetes confers equivalent risk to established coronary disease (CAD risk equivalent), inducing advanced glycation end-products and micro/macrovascular damage.",
        "evidence_sources": [
            "American Diabetes Association. Standards of Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1):S1-S343."
        ],
        "modifiable": True,
        "target_reference": "HbA1c < 7.0%, Fasting glucose 80-130 mg/dL"
    },
    "south_asian_ethnicity": {
        "name": "South Asian Phenotype (Higher Premature CAD Risk)",
        "description": "South Asian individuals develop CAD 1-2 decades earlier than Western populations, with higher rates of multi-vessel disease and metabolic syndrome at lower BMI thresholds.",
        "evidence_sources": [
            "Volgman AS, et al. Atherosclerotic Cardiovascular Disease in South Asians in the United States: A Scientific Statement From the American Heart Association. Circulation. 2018;138(1):e1-e34.",
            "Enas EA, et al. Coronary artery disease in Asian Indians (CADI study). Indian Heart J. 1996;48(4):343-353."
        ],
        "modifiable": False,
        "clinical_note": "Standard Framingham 2008 often underestimates risk in South Asians; risk enhancement consideration is recommended by ACC/AHA guidelines."
    }
}
