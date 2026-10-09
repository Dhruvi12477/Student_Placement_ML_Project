"""
FirstStep AI - Student Placement Readiness
Flask backend for an ML-powered student placement predictor.
The ML model uses the original academic/profile features. Additional
career questions are used to personalize recommendations and do not
change the trained model's feature schema.
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from pathlib import Path
from datetime import datetime
import joblib
import pandas as pd
import numpy as np
import warnings

warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "placement_prediction_model.pkl"
DATASET_PATH = BASE_DIR / "Indian_Student_Placement_Dataset.csv"

app = Flask(
    __name__,
    template_folder=str(BASE_DIR / "templates"),
    static_folder=str(BASE_DIR / "static"),
)
CORS(app)

# These are the exact features expected by the trained ML pipeline.
NUMERIC_FEATURES = [
    "age", "cgpa", "backlogs", "internships", "certifications",
    "coding_skills", "communication_skills", "aptitude_score", "projects"
]
CATEGORICAL_FEATURES = ["gender", "degree", "branch"]

# Extra education choices for the UI. The trained OneHotEncoder uses
# handle_unknown='ignore', so a degree/branch not present in the training
# dataset will not crash prediction.
COMMON_DEGREES = [
    "BCA", "BTech", "BE", "BSc", "BCom", "BBA", "BA", "BCS",
    "B.Voc", "B.Des", "BPharm", "LLB", "MCA", "MTech", "ME",
    "MSc", "MCom", "MBA", "MA", "M.Des", "PGDM", "LLM", "Other"
]

COMMON_BRANCHES = [
    "CS", "IT", "ECE", "AI & ML", "Data Science", "Cyber Security",
    "Electrical", "Electronics", "Mechanical", "Civil", "Commerce",
    "Management", "Finance", "Marketing", "Design", "Other"
]

CAREER_SKILL_MAP = {
    "Software Development": ["Programming", "DSA", "Git/GitHub", "SQL", "Projects"],
    "Data Science & AI": ["Python", "SQL", "Statistics", "Machine Learning", "Power BI/Tableau"],
    "Web Development": ["HTML/CSS", "JavaScript", "React", "Backend/API", "Git/GitHub"],
    "UI/UX Design": ["Figma", "UI Design", "UX Research", "Prototyping", "Portfolio"],
    "Digital Marketing": ["SEO", "Social Media", "Google Analytics", "Content", "Performance Marketing"],
    "Cyber Security": ["Networking", "Linux", "Security Fundamentals", "Python", "Security Tools"],
    "Cloud / DevOps": ["Linux", "Networking", "AWS/Azure", "Docker", "CI/CD"],
    "Business / Finance": ["Excel", "Financial Analysis", "Communication", "Presentation", "Business Fundamentals"],
    "HR": ["Communication", "Recruitment", "Excel", "HR Fundamentals", "Interview Skills"],
    "Sales": ["Communication", "Negotiation", "CRM", "Presentation", "Customer Understanding"],
    "Other / Not Sure": ["Communication", "Excel", "Digital Skills", "Problem Solving", "One Job-Specific Skill"],
}


def load_model_and_data():
    model = None
    dataset = None

    try:
        model = joblib.load(MODEL_PATH)
        print(f"✓ Model loaded successfully from {MODEL_PATH.name}")
    except Exception as exc:
        print(f"✗ Model loading failed: {exc}")

    try:
        dataset = pd.read_csv(DATASET_PATH)
        print(f"✓ Dataset loaded: {len(dataset)} records")
    except Exception as exc:
        print(f"✗ Dataset loading failed: {exc}")

    return model, dataset


MODEL, DATASET = load_model_and_data()


def get_options(column, fallback):
    dataset_values = []
    if DATASET is not None and column in DATASET.columns:
        dataset_values = DATASET[column].dropna().astype(str).unique().tolist()
    return sorted(set(dataset_values + fallback), key=str.lower)


def get_config():
    return {
        "genders": get_options("gender", ["Male", "Female", "Other"]),
        "degrees": get_options("degree", COMMON_DEGREES),
        "branches": get_options("branch", COMMON_BRANCHES),
        "career_goals": list(CAREER_SKILL_MAP.keys()),
        "success": True,
    }


def validate_input(data):
    errors = []

    if not isinstance(data, dict):
        return ["Invalid JSON request body"]

    # The redesigned UI intentionally hides four legacy academic/model fields.
    # Keep the trained model schema intact by supplying neutral defaults when
    # those values are not sent by the frontend.
    data.setdefault("branch", "Other")
    data.setdefault("cgpa", 7.0)
    data.setdefault("backlogs", 0)
    data.setdefault("aptitude_score", 70)

    # Only the original ML fields are mandatory for prediction.
    for field in CATEGORICAL_FEATURES + NUMERIC_FEATURES:
        if field not in data or data[field] in ("", None):
            errors.append(f"{field} is required")

    if errors:
        return errors

    try:
        age = float(data["age"])
        cgpa = float(data["cgpa"])
        backlogs = int(data["backlogs"])
        internships = int(data["internships"])
        certifications = int(data["certifications"])
        coding = int(data["coding_skills"])
        communication = int(data["communication_skills"])
        aptitude = int(data["aptitude_score"])
        projects = int(data["projects"])
    except (TypeError, ValueError):
        return ["Please enter valid numeric values in all numeric fields"]

    if not 15 <= age <= 35:
        errors.append("Age must be between 15 and 35")
    if not 0 <= cgpa <= 10:
        errors.append("CGPA must be between 0 and 10")
    if backlogs < 0:
        errors.append("Backlogs cannot be negative")
    if internships < 0:
        errors.append("Internships cannot be negative")
    if certifications < 0:
        errors.append("Certifications cannot be negative")
    if not 1 <= coding <= 10:
        errors.append("Coding skills must be between 1 and 10")
    if not 1 <= communication <= 10:
        errors.append("Communication skills must be between 1 and 10")
    if not 0 <= aptitude <= 100:
        errors.append("Aptitude score must be between 0 and 100")
    if projects < 0:
        errors.append("Projects cannot be negative")

    valid = get_config()
    if str(data["gender"]) not in valid["genders"]:
        errors.append("Invalid gender selected")
    if str(data["degree"]) not in valid["degrees"]:
        errors.append("Invalid degree selected")
    if str(data["branch"]) not in valid["branches"]:
        errors.append("Invalid branch selected")

    return errors


def prepare_prediction_data(data):
    return pd.DataFrame([{
        "gender": str(data["gender"]),
        "age": int(float(data["age"])),
        "degree": str(data["degree"]),
        "branch": str(data["branch"]),
        "cgpa": float(data["cgpa"]),
        "backlogs": int(data["backlogs"]),
        "internships": int(data["internships"]),
        "certifications": int(data["certifications"]),
        "coding_skills": int(data["coding_skills"]),
        "communication_skills": int(data["communication_skills"]),
        "aptitude_score": int(data["aptitude_score"]),
        "projects": int(data["projects"]),
    }])


def get_probabilities(model, prediction_data):
    raw = model.predict_proba(prediction_data)[0]
    classes = getattr(model, "classes_", [0, 1])

    not_placed = 0.0
    placed = 0.0

    for cls, prob in zip(classes, raw):
        if int(cls) == 1:
            placed = float(prob)
        elif int(cls) == 0:
            not_placed = float(prob)

    return not_placed, placed


def normalize_text(value):
    if value is None:
        return ""
    return str(value).strip()


def build_career_guidance(data):
    """Create practical, goal-aware guidance from the student's extra inputs."""
    goal = normalize_text(data.get("career_goal")) or "Other / Not Sure"
    current_course = normalize_text(data.get("current_course"))
    skills_text = normalize_text(data.get("skills"))

    target_skills = CAREER_SKILL_MAP.get(goal, CAREER_SKILL_MAP["Other / Not Sure"])

    if not skills_text or skills_text.lower() in {
        "none", "no", "no skills", "nothing", "not yet", "n/a", "na"
    }:
        skills_status = "You have not listed any current skills yet. That's okay — everyone starts somewhere."
        missing = target_skills[:5]
        skill_action = (
            f"Start building these job-ready skills for {goal}: "
            + ", ".join(missing) + "."
        )
    else:
        skills_status = f"Skills you listed: {skills_text}"
        skill_action = (
            f"Keep strengthening your current skills and add the most important "
            f"skills for {goal}: " + ", ".join(target_skills[:5]) + "."
        )

    course_note = (
        f"Current course: {current_course}. Connect your course learning to "
        f"real projects related to {goal}."
        if current_course
        else "If you are currently studying a course, turn at least one topic into a real project."
    )

    return {
        "career_goal": goal,
        "current_course": current_course or "Not provided",
        "skills": skills_text or "No skills listed yet",
        "skills_status": skills_status,
        "skill_action": skill_action,
        "course_note": course_note,
        "target_skills": target_skills,
    }


def get_recommendations(row, placed_probability, career_guidance):
    recommendations = []

    cgpa = float(row["cgpa"])
    coding = int(row["coding_skills"])
    communication = int(row["communication_skills"])
    aptitude = int(row["aptitude_score"])
    internships = int(row["internships"])
    projects = int(row["projects"])
    certifications = int(row["certifications"])
    backlogs = int(row["backlogs"])

    if cgpa < 7:
        recommendations.append(
            "Improve your CGPA where possible. Strong academic performance can help with eligibility for more opportunities."
        )
    if coding < 7:
        recommendations.append(
            "Build coding confidence through regular practice and practical projects you can explain in interviews."
        )
    if communication < 7:
        recommendations.append(
            "Practice communication, mock interviews and explaining your projects clearly in simple language."
        )
    if aptitude < 70:
        recommendations.append(
            "Practice quantitative aptitude, logical reasoning and timed placement-test questions."
        )
    if internships < 1:
        recommendations.append(
            "Gain practical experience through internships, freelance work, volunteering or real-world projects."
        )
    if projects < 2:
        recommendations.append(
            "Create at least two strong portfolio projects with a clear problem, solution, technology stack and result."
        )
    if certifications < 2:
        recommendations.append(
            "Choose relevant certifications that support your target role, but prioritize practical skills over certificates."
        )
    if backlogs > 0:
        recommendations.append(
            "Work toward clearing backlogs because some employers use backlog limits as an eligibility criterion."
        )

    # Always give a personalized career action based on the new UI fields.
    recommendations.append(career_guidance["skill_action"])
    recommendations.append(career_guidance["course_note"])

    if placed_probability >= 0.70:
        readiness = "Strong readiness"
    elif placed_probability >= 0.45:
        readiness = "Developing readiness"
    else:
        readiness = "Needs focused improvement"

    return recommendations[:8], readiness


def analyze_profile(row):
    scores = {
        "Academic": round(float(row["cgpa"]), 1),
        "Coding": int(row["coding_skills"]),
        "Communication": int(row["communication_skills"]),
        "Aptitude": round(int(row["aptitude_score"]) / 10, 1),
        "Experience": min(10, int(row["internships"]) * 3 + int(row["projects"])),
    }

    ordered = sorted(scores.items(), key=lambda item: item[1], reverse=True)

    return {
        "strengths": [name for name, _ in ordered[:2]],
        "weaknesses": [name for name, _ in ordered[-2:]],
        "scores": {k: float(v) for k, v in scores.items()},
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/config")
def api_config():
    return jsonify(get_config())


@app.route("/api/sample-data")
def sample_data():
    options = get_config()
    sample = {
        "gender": "Female" if "Female" in options["genders"] else options["genders"][0],
        "age": 21,
        "degree": "BCA" if "BCA" in options["degrees"] else options["degrees"][0],
        "branch": "IT" if "IT" in options["branches"] else options["branches"][0],
        "cgpa": 8.5,
        "backlogs": 0,
        "internships": 2,
        "certifications": 3,
        "coding_skills": 8,
        "communication_skills": 8,
        "aptitude_score": 85,
        "projects": 3,
        "skills": "Python, SQL, Excel, Machine Learning",
        "current_course": "MSc IT Data Science & Analytics",
        "career_goal": "Data Science & AI",
    }
    return jsonify({"success": True, "data": sample})


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        if MODEL is None:
            return jsonify({
                "success": False,
                "error": "ML model is not loaded. Check placement_prediction_model.pkl."
            }), 500

        data = request.get_json(silent=True)
        errors = validate_input(data)

        if errors:
            return jsonify({"success": False, "errors": errors}), 400

        prediction_data = prepare_prediction_data(data)
        prediction = int(MODEL.predict(prediction_data)[0])
        not_placed_prob, placed_prob = get_probabilities(MODEL, prediction_data)

        career_guidance = build_career_guidance(data)
        recommendations, readiness = get_recommendations(
            prediction_data.iloc[0], placed_prob, career_guidance
        )
        analysis = analyze_profile(prediction_data.iloc[0])

        # Explicit native Python values prevent numpy int64/float64 JSON errors.
        result = {
            "success": True,
            "prediction": int(prediction),
            "status": "Placed" if prediction == 1 else "Not Placed",
            "readiness": readiness,
            "confidence": {
                "placed": round(float(placed_prob) * 100, 2),
                "not_placed": round(float(not_placed_prob) * 100, 2),
            },
            "student_profile": {
                "gender": str(data["gender"]),
                "age": int(float(data["age"])),
                "degree": str(data["degree"]),
                "branch": str(data["branch"]),
                "cgpa": float(data["cgpa"]),
                "backlogs": int(data["backlogs"]),
                "internships": int(data["internships"]),
                "certifications": int(data["certifications"]),
                "coding_skills": int(data["coding_skills"]),
                "communication_skills": int(data["communication_skills"]),
                "aptitude_score": int(data["aptitude_score"]),
                "projects": int(data["projects"]),
            },
            "career_guidance": career_guidance,
            "analysis": analysis,
            "recommendations": recommendations,
            "timestamp": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        }

        return jsonify(result)

    except Exception as exc:
        print(f"✗ Prediction error: {exc}")
        return jsonify({
            "success": False,
            "error": f"Prediction error: {str(exc)}"
        }), 500


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("FIRSTSTEP AI - STUDENT PLACEMENT READINESS")
    print("=" * 80)
    print(f"✓ Model Status: {'Loaded' if MODEL is not None else 'Not Loaded'}")
    print(f"✓ Dataset Status: {'Loaded' if DATASET is not None else 'Not Loaded'}")
    print("\n🚀 Starting Flask Application...")
    print("📍 Server: http://127.0.0.1:5000")
    print("📍 Open in browser: http://localhost:5000")
    print("=" * 80 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
