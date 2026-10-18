"""Enumeration of known cardiovascular risk factors and their clinical evidence sources."""

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Optional


class RiskFactorCategory(str, Enum):
    MODIFIABLE_LIFESTYLE = "modifiable_lifestyle"
    MODIFIABLE_METABOLIC = "modifiable_metabolic"
    NON_MODIFIABLE = "non_modifiable"
    EMERGING_BIOMARKER = "emerging_biomarker"
    POPULATION_SPECIFIC = "population_specific"


@dataclass
class RiskFactor:
    id: str
    name: str
    category: RiskFactorCategory
    description: str
    relative_risk_or_impact: str
    evidence_level: str
    citations: List[str]
    interventions: List[str]


KNOWN_CARDIOVASCULAR_RISK_FACTORS: Dict[str, RiskFactor] = {
    "hypertension": RiskFactor(
        id="hypertension",
        name="Hypertension / Elevated Blood Pressure",
        category=RiskFactorCategory.MODIFIABLE_METABOLIC,
        description="Persistent systolic BP >= 130 mmHg or diastolic BP >= 80 mmHg (ACC/AHA 2017 definition).",
        relative_risk_or_impact="Doubles cardiovascular mortality risk for each 20 mmHg SBP / 10 mmHg DBP increase above 115/75.",
        evidence_level="Class I, Level A",
        citations=[
            "Whelton PK, et al. 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. J Am Coll Cardiol. 2018;71(19):e127-e248.",
            "INTERHEART Study: Yusuf S, et al. Effect of potentially modifiable risk factors associated with myocardial infarction in 52 countries. Lancet. 2004;364(9438):937-952.",
        ],
        interventions=[
            "DASH diet (low sodium, high potassium)",
            "Aerobic physical activity (>= 150 min/week moderate)",
            "Pharmacotherapy (ACEi, ARBs, CCBs, Thiazides) per clinical guideline",
        ],
    ),
    "dyslipidemia": RiskFactor(
        id="dyslipidemia",
        name="Dyslipidemia (Elevated LDL-C, Low HDL-C, High Triglycerides)",
        category=RiskFactorCategory.MODIFIABLE_METABOLIC,
        description="Elevated apolipoprotein B-containing lipoproteins and atherogenic cholesterol particles.",
        relative_risk_or_impact="INTERHEART identified ApoB/ApoA1 ratio as the strongest global predictor of myocardial infarction (PAR 49.2%).",
        evidence_level="Class I, Level A",
        citations=[
            "Grundy SM, et al. 2018 AHA/ACC/AACVPR/AAPA/ABC/ACPM/ADA/AGS/APhA/ASPC/NLA/PCNA Guideline on the Management of Blood Cholesterol. Circulation. 2019;139(25):e1082-e1143.",
            "Yusuf S, et al. Lancet 2004 (INTERHEART).",
        ],
        interventions=[
            "Dietary reduction in saturated and trans fats",
            "Statin therapy based on ASCVD risk category",
            "Weight management and regular exercise",
        ],
    ),
    "tobacco_use": RiskFactor(
        id="tobacco_use",
        name="Tobacco Use and Secondhand Smoke",
        category=RiskFactorCategory.MODIFIABLE_LIFESTYLE,
        description="Combustible cigarettes, bidi, hookahs, or smokeless tobacco use.",
        relative_risk_or_impact="Current smoking roughly doubles 10-year risk of coronary heart disease and stroke.",
        evidence_level="Class I, Level A",
        citations=[
            "US Department of Health and Human Services. The Health Consequences of Smoking—50 Years of Progress: A Report of the Surgeon General. 2014.",
            "Joshi P, Islam S, Pais P, et al. Risk factors for early myocardial infarction in South Asians (INTERHEART study). JAMA. 2007;297(3):286-294.",
        ],
        interventions=[
            "Complete tobacco cessation",
            "Nicotine replacement therapy / bupropion / varenicline under medical supervision",
            "Avoidance of passive secondhand smoke",
        ],
    ),
    "diabetes_mellitus": RiskFactor(
        id="diabetes_mellitus",
        name="Type 2 Diabetes Mellitus & Insulin Resistance",
        category=RiskFactorCategory.MODIFIABLE_METABOLIC,
        description="Fasting plasma glucose >= 126 mg/dL or HbA1c >= 6.5%.",
        relative_risk_or_impact="Historically considered a CHD risk equivalent; confers 2- to 4-fold increase in CVD events.",
        evidence_level="Class I, Level A",
        citations=[
            "American Diabetes Association. Cardiovascular Disease and Risk Management: Standards of Medical Care in Diabetes—2024. Diabetes Care. 2024;47(Suppl 1):S179-S218.",
            "INTERHEART Study: Yusuf et al. Lancet 2004.",
        ],
        interventions=[
            "Glycemic control (target individualized, HbA1c < 7.0% for most)",
            "Cardiovascular protective agents (SGLT2 inhibitors, GLP-1 receptor agonists)",
            "Dietary fiber increase and refined carbohydrate reduction",
        ],
    ),
    "south_asian_ethnicity": RiskFactor(
        id="south_asian_ethnicity",
        name="South Asian Ancestry (Risk Enhancer)",
        category=RiskFactorCategory.POPULATION_SPECIFIC,
        description="Individuals of Indian, Pakistani, Bangladeshi, Sri Lankan, or Nepali descent.",
        relative_risk_or_impact="Presents with CVD 10 years earlier on average, with higher rates of premature CAD, smaller coronary caliber, and higher visceral adiposity at lower BMI.",
        evidence_level="Class IIa, Level B-NR (ACC/AHA Risk Enhancer)",
        citations=[
            "Volgman AS, et al. Atherosclerotic Cardiovascular Disease in South Asians in the United States: A Scientific Statement From the AHA. Circulation. 2018;138(1):e1-e34.",
            "Joshi P, et al. Risk factors for early myocardial infarction in South Asians. JAMA. 2007;297(3):286-294.",
            "Arnett DK, et al. 2019 ACC/AHA Guideline on the Primary Prevention of Cardiovascular Disease. Circulation. 2019;140(11):e596-e646.",
        ],
        interventions=[
            "Early CVD screening starting at age 20-30",
            "Lower BMI and waist circumference cutoff thresholds for South Asians (BMI >= 23 overweight, >= 25 obese per WHO Asia-Pacific)",
            "Aggressive lifestyle counseling and lipid monitoring",
        ],
    ),
    "age_and_biological_sex": RiskFactor(
        id="age_and_biological_sex",
        name="Advancing Age & Male Sex / Postmenopausal Female",
        category=RiskFactorCategory.NON_MODIFIABLE,
        description="Cardiovascular risk increases progressively with age; males develop CAD earlier; female risk accelerates post-menopause.",
        relative_risk_or_impact="Strongest non-modifiable determinant of absolute 10-year CVD risk.",
        evidence_level="Class I, Level A",
        citations=[
            "D'Agostino RB Sr, et al. General cardiovascular risk profile for use in primary care. Circulation. 2008;117(6):743-753.",
        ],
        interventions=[
            "Periodic risk stratification",
            "Intensified prevention targeting modifiable risk factors as age advances",
        ],
    ),
    "lipoprotein_a": RiskFactor(
        id="lipoprotein_a",
        name="Elevated Lipoprotein(a) [Lp(a)]",
        category=RiskFactorCategory.EMERGING_BIOMARKER,
        description="Genetically determined variant of LDL with apolipoprotein(a) covalently bound; pro-atherogenic and pro-thrombotic.",
        relative_risk_or_impact="Lp(a) > 50 mg/dL (> 125 nmol/L) independently increases CAD and aortic stenosis risk; highly prevalent in South Asians.",
        evidence_level="Class IIa, Level B-NR",
        citations=[
            "Kronenberg F, et al. Lipoprotein(a) in atherosclerotic cardiovascular disease and aortic stenosis: a European Atherosclerosis Society consensus statement. Eur Heart J. 2022;43(39):3925-3946.",
            "Enas EA, et al. High prevalence of elevated Lipoprotein(a) in Asian Indians: CADI Study. Am J Cardiol. 1998;81(5):650-652.",
        ],
        interventions=[
            "One-time measurement in adults",
            "Aggressive management of all other modifiable risk factors",
            "Emerging targeted antisense therapies in clinical trials",
        ],
    ),
}


def get_risk_factor_by_id(factor_id: str) -> Optional[RiskFactor]:
    """Retrieve risk factor metadata by unique identifier."""
    return KNOWN_CARDIOVASCULAR_RISK_FACTORS.get(factor_id)
